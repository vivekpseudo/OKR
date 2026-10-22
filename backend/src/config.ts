import 'dotenv/config';
import { z } from 'zod';
export const env = z.object({
 NODE_ENV:z.enum(['development','test','production']).default('development'),
 PORT:z.coerce.number().int().min(1).max(65535).default(3001),
 DATABASE_URL:z.string().min(1), JWT_SECRET:z.string().min(32), TOKEN_TTL:z.string().default('15m'),
 CORS_ORIGIN:z.string().default('http://localhost:8080'), APP_BASE_URL:z.string().url().default('http://localhost:8080'),
 NOTIFICATION_SERVICE_URL:z.string().url().default('http://host.docker.internal:8000/api/events/'),
 NOTIFICATION_SERVICE_SHARED_SECRET:z.string().default(''), NOTIFICATION_SERVICE_ENABLED:z.string().default('false'),
 INTEGRATION_ENCRYPTION_KEY:z.string().default(''), REMINDER_CRON:z.string().default('0 9 * * 1'), REMINDER_TIMEZONE:z.string().default('UTC')
}).parse(process.env);
export const notificationsEnabled=env.NOTIFICATION_SERVICE_ENABLED.toLowerCase()==='true';
if(env.NODE_ENV==='production' && notificationsEnabled && env.NOTIFICATION_SERVICE_SHARED_SECRET.length<32) throw new Error('Set a 32+ character notification shared secret in production.');
if(env.INTEGRATION_ENCRYPTION_KEY && !/^[a-f0-9]{64}$/i.test(env.INTEGRATION_ENCRYPTION_KEY)) throw new Error('INTEGRATION_ENCRYPTION_KEY must be 64 hex characters.');
