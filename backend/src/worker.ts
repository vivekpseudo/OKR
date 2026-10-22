import cron from 'node-cron';
import {pool,query} from './db.js';
import {env} from './config.js';
import {sendNotificationEvent} from './notifications.js';
import {sendWorkspaceIntegrationMessages} from './integrations.js';

type DueUser={user_id:string;organization_id:string;email:string;name:string};
type DueOrganization={organization_id:string;name:string};
const periodKey=()=>{const d=new Date();d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);};

async function claimReminder(table:'reminder_deliveries'|'workspace_reminder_deliveries', orgId:string, userId:string|null, type:string, period:string) {
 if(table==='reminder_deliveries') return query(
  "INSERT INTO reminder_deliveries(organization_id,user_id,reminder_type,period_key,status) VALUES($1,$2,$3,$4,'queued') ON CONFLICT(user_id,reminder_type,period_key) DO UPDATE SET status='queued',last_error=NULL,created_at=now() WHERE reminder_deliveries.status='failed' OR (reminder_deliveries.status='queued' AND reminder_deliveries.created_at < now()-interval '10 minutes') RETURNING id",
  [orgId,userId,type,period]
 );
 return query(
  "INSERT INTO workspace_reminder_deliveries(organization_id,reminder_type,period_key,status) VALUES($1,$2,$3,'queued') ON CONFLICT(organization_id,reminder_type,period_key) DO UPDATE SET status='queued',last_error=NULL,created_at=now() WHERE workspace_reminder_deliveries.status='failed' OR (workspace_reminder_deliveries.status='queued' AND workspace_reminder_deliveries.created_at < now()-interval '10 minutes') RETURNING id",
  [orgId,type,period]
 );
}

async function runReminders(){
 const period=periodKey();
 const organizations=await query<DueOrganization>(
  "SELECT DISTINCT o.organization_id, org.name FROM objectives o JOIN organizations org ON org.id=o.organization_id JOIN integrations i ON i.organization_id=org.id AND i.enabled=true WHERE o.status <> 'complete'"
 );
 for(const org of organizations.rows){
  const claim=await claimReminder('workspace_reminder_deliveries',org.organization_id,null,'weekly_workspace_checkin',period);
  if(claim.rowCount){
   try{
    const sent=await sendWorkspaceIntegrationMessages(org.organization_id,'Weekly OKR check-in reminder for '+org.name+': please review progress and update key results. '+env.APP_BASE_URL);
    await query("UPDATE workspace_reminder_deliveries SET status='sent',sent_at=now(),last_error=NULL WHERE id=$1",[claim.rows[0].id]);
    console.log('Delivered workspace reminder for '+org.organization_id+' to '+sent+' integrations');
   }catch(e){
    await query("UPDATE workspace_reminder_deliveries SET status='failed',last_error=$2 WHERE id=$1",[claim.rows[0].id,e instanceof Error?e.message.slice(0,500):'unknown error']);
    console.error('Workspace reminder failed for '+org.organization_id,e);
   }
  }
 }
 const users=await query<DueUser>(
  "SELECT u.id user_id,u.organization_id,u.email,u.name FROM users u WHERE u.active=true AND EXISTS(SELECT 1 FROM objectives o WHERE o.organization_id=u.organization_id AND o.status <> 'complete')"
 );
 for(const u of users.rows){
  const claim=await claimReminder('reminder_deliveries',u.organization_id,u.user_id,'weekly_checkin',period);
  if(!claim.rowCount)continue;
  try{
   const result=await sendNotificationEvent({event_type:'okr.weekly_checkin_reminder',user_id:u.user_id,source:'okr',timestamp:new Date().toISOString(),payload:{organization_id:u.organization_id,email:u.email,name:u.name,app_url:env.APP_BASE_URL,reminder_period:period,message:'Time for your weekly OKR check-in.'}});
   if((result as {skipped?:boolean}).skipped) throw new Error('Notification service is disabled');
   await query("UPDATE reminder_deliveries SET status='sent',sent_at=now(),last_error=NULL WHERE id=$1",[claim.rows[0].id]);
  }catch(e){
   await query("UPDATE reminder_deliveries SET status='failed',last_error=$2 WHERE id=$1",[claim.rows[0].id,e instanceof Error?e.message.slice(0,500):'unknown error']);
   console.error('User reminder failed for '+u.user_id,e);
  }
 }
}
if(process.env.RUN_REMINDER_WORKER==='true'){
 cron.schedule(env.REMINDER_CRON,()=>{void runReminders().catch(e=>console.error('Reminder run failed',e));},{timezone:env.REMINDER_TIMEZONE});
 console.log('Reminder schedule: '+env.REMINDER_CRON+' '+env.REMINDER_TIMEZONE);
}
process.on('SIGTERM',async()=>{await pool.end();process.exit(0);});
