import {createHmac} from 'node:crypto';
import {env,notificationsEnabled} from './config.js';
type Event={event_type:string;user_id:string;source:string;payload:Record<string,unknown>;timestamp:string};
export async function sendNotificationEvent(event:Event){
 if(!notificationsEnabled)return{skipped:true,reason:'notification service disabled'};
 if(env.NOTIFICATION_SERVICE_SHARED_SECRET.length<32)throw new Error('Notification shared secret is not configured');
 const body=JSON.stringify(event),ts=String(Math.floor(Date.now()/1000));
 const signature=createHmac('sha256',env.NOTIFICATION_SERVICE_SHARED_SECRET).update(ts+'.'+body).digest('hex');
 const res=await fetch(env.NOTIFICATION_SERVICE_URL,{method:'POST',headers:{'content-type':'application/json','x-okr-timestamp':ts,'x-okr-signature':signature},body,signal:AbortSignal.timeout(5000),redirect:'error'});
 if(!res.ok)throw new Error('Notification service returned HTTP '+res.status);
 return res.json().catch(()=>({accepted:true}));
}
