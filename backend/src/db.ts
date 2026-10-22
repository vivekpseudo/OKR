import pg from 'pg';
import {env} from './config.js';
const {Pool}=pg;
export const pool=new Pool({connectionString:env.DATABASE_URL,max:15,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl:env.NODE_ENV==='production'?{rejectUnauthorized:true}:undefined});
pool.on('error',e=>console.error('Unexpected PostgreSQL pool error',e));
export const query=<T extends pg.QueryResultRow=pg.QueryResultRow>(sql:string,params:unknown[]=[] )=>pool.query<T>(sql,params);
