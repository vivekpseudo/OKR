import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import type {FastifyReply,FastifyRequest} from 'fastify';
import {env} from './config.js';
export type AuthUser={id:string;organizationId:string;email:string;name:string;role:'owner'|'admin'|'member'};
declare module 'fastify'{interface FastifyRequest{user?:AuthUser}}
export const hashPassword=(p:string)=>bcrypt.hash(p,12);
export const verifyPassword=(p:string,h:string)=>bcrypt.compare(p,h);
export function signAccessToken(u:AuthUser){return jwt.sign({sub:u.id,organizationId:u.organizationId,email:u.email,name:u.name,role:u.role},env.JWT_SECRET,{expiresIn:env.TOKEN_TTL as jwt.SignOptions['expiresIn'],issuer:'okr-api',audience:'okr-api'});}
export function verifyAccessToken(t:string):AuthUser{const p=jwt.verify(t,env.JWT_SECRET,{issuer:'okr-api',audience:'okr-api'}) as jwt.JwtPayload;if(!p.sub||!p.organizationId||!p.role)throw new Error('Invalid token');return{id:String(p.sub),organizationId:String(p.organizationId),email:String(p.email),name:String(p.name),role:p.role as AuthUser['role']};}
export async function authenticate(req:FastifyRequest,reply:FastifyReply){const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return reply.code(401).send({error:'Authentication required'});try{req.user=verifyAccessToken(h.slice(7));}catch{return reply.code(401).send({error:'Invalid or expired access token'});}}
export function requireAdmin(req:FastifyRequest,reply:FastifyReply){if(!req.user||!['owner','admin'].includes(req.user.role))return reply.code(403).send({error:'Workspace administrator required'});}
export const hashToken=(t:string)=>createHash('sha256').update(t).digest('hex');
function key(){if(!env.INTEGRATION_ENCRYPTION_KEY)throw new Error('Integration encryption is not configured');return Buffer.from(env.INTEGRATION_ENCRYPTION_KEY,'hex');}
export function encryptSecret(v:string){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key(),iv),body=Buffer.concat([c.update(v,'utf8'),c.final()]);return[iv.toString('hex'),c.getAuthTag().toString('hex'),body.toString('hex')].join(':');}
export function decryptSecret(v:string){const[iv,tag,body]=v.split(':');if(!iv||!tag||!body)throw new Error('Malformed encrypted secret');const d=createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'hex'));d.setAuthTag(Buffer.from(tag,'hex'));return Buffer.concat([d.update(Buffer.from(body,'hex')),d.final()]).toString('utf8');}
