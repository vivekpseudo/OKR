import cron from 'node-cron';
import {pool,query} from './db.js';
import {env} from './config.js';
import {sendNotificationEvent} from './notifications.js';
type DueUser={user_id:string;organization_id:string;email:string;name:string};
async function runReminders(){
 const period=new Date().toISOString().slice(0,10);
 const users=await query<DueUser>("SELECT u.id user_id,u.organization_id,u.email,u.name FROM users u WHERE u.active=true AND EXISTS(SELECT 1 FROM objectives o WHERE o.organization_id=u.organization_id AND o.status <> 'complete')");
 for(const u of users.rows){
  const claim=await query("INSERT INTO reminder_deliveries(organization_id,user_id,reminder_type,period_key,status) VALUES($1,$2,'weekly_checkin',$3,'queued') ON CONFLICT(user_id,reminder_type,period_key) DO NOTHING RETURNING id",[u.organization_id,u.user_id,period]);
  if(!claim.rowCount)continue;
  try{
   await sendNotificationEvent({event_type:'okr.weekly_checkin_reminder',user_id:u.user_id,source:'okr',timestamp:new Date().toISOString(),payload:{organization_id:u.organization_id,email:u.email,name:u.name,app_url:env.APP_BASE_URL,reminder_period:period,message:'Time for your weekly OKR check-in.'}});
   await query("UPDATE reminder_deliveries SET status='sent',sent_at=now(),last_error=NULL WHERE id=$1",[claim.rows[0].id]);
  }catch(e){await query("UPDATE reminder_deliveries SET status='failed',last_error=$2 WHERE id=$1",[claim.rows[0].id,e instanceof Error?e.message.slice(0,500):'unknown error']);console.error('Reminder failed for user '+u.user_id,e);}
 }
}
if(process.env.RUN_REMINDER_WORKER==='true'){cron.schedule(env.REMINDER_CRON,()=>{void runReminders().catch(e=>console.error('Reminder run failed',e));},{timezone:env.REMINDER_TIMEZONE});console.log('Reminder schedule: '+env.REMINDER_CRON+' '+env.REMINDER_TIMEZONE);}
process.on('SIGTERM',async()=>{await pool.end();process.exit(0);});
