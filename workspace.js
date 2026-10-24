import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { createAuth } from './auth.js';
import { createOperations } from './operations.js';

export function createWorkspace(store,root) {
 const db=store.db,auth=createAuth(db),operations=createOperations(store,root,auth);
 const business=()=>db.prepare('SELECT name,address,phone FROM business_settings WHERE id=1').get();
 const assert=(ok,message,status=400)=>{if(!ok){const e=Error(message);e.status=status;throw e}};
 async function body(req,limit=6e6){assert(req.headers['content-type']?.startsWith('application/json'),'JSON content is required');let raw='';for await(const chunk of req){raw+=chunk;assert(Buffer.byteLength(raw)<=limit,'File or request is too large',413)}return JSON.parse(raw)}
 function type(b){if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')return 'image/webp';return null}
 async function handle(req,res,url){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  const port=process.env.PORT||3000;assert([`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host),'Invalid request host',403);
  if(req.method==='GET'&&url.pathname==='/api/health'){res.end(JSON.stringify({application:'ceylon-pure-homecare',instanceId:process.env.WORKSPACE_INSTANCE||null,processId:process.pid}));return true}
  const key=auth.session(req);
  if(req.method==='GET'&&url.pathname==='/api/auth/status'){res.end(JSON.stringify({configured:auth.configured(),authenticated:!!key,business:business()}));return true}
  if(req.method==='POST'&&['/api/auth/setup','/api/auth/login'].includes(url.pathname)){const b=await body(req);if(url.pathname.endsWith('setup'))auth.setup(b.pin,res);else auth.login(b.pin,res);res.end('{"authenticated":true}');return true}
  assert(key,'Please sign in to continue.',401);
  if(await operations.handle(req,res,url,key,body))return true;
  if(req.method==='GET'&&url.pathname.startsWith('/api/images/')){const image=db.prepare('SELECT mime,content FROM images WHERE id=?').get(url.pathname.slice(12));assert(image,'Image not found',404);res.setHeader('Content-Type',image.mime);res.end(image.content);return true}
  if(req.method==='GET'&&url.pathname==='/api/audit'){res.end(JSON.stringify(db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 100').all()));return true}
  if(req.method==='GET'&&url.pathname==='/api/payments'){res.end(JSON.stringify(db.prepare('SELECT id,order_id AS orderId,amount_cents / 100.0 AS amount,received_at AS date FROM payments ORDER BY id DESC').all()));return true}
  if(req.method==='GET'&&url.pathname==='/api/backup'){
   const target=path.join(root,'data',`download-${randomUUID()}.sqlite`);db.prepare('VACUUM INTO ?').run(target);
   try{res.setHeader('Content-Type','application/vnd.sqlite3');res.setHeader('Content-Disposition',`attachment; filename="factory-backup-${new Date().toISOString().slice(0,10)}.sqlite"`);res.end(readFileSync(target));auth.audit('Database backup downloaded')}finally{unlinkSync(target)}return true;
  }
  const routes=['/api/auth/logout','/api/auth/change-pin','/api/settings','/api/images'];if(!routes.includes(url.pathname))return false;
  assert(req.method==='POST','Unsupported request',405);const b=await body(req);
  if(url.pathname==='/api/auth/logout'){auth.logout(key,res);res.end('{}')}
  if(url.pathname==='/api/auth/change-pin'){auth.change(b.currentPin,b.newPin,res);res.end('{}')}
  if(url.pathname==='/api/settings'){
   assert(typeof b.name==='string'&&b.name.trim()&&b.name.length<=100,'Enter a factory name (up to 100 characters)');assert(typeof b.address==='string'&&b.address.length<=500&&typeof b.phone==='string'&&b.phone.length<=50,'Enter valid contact details');
   db.prepare('UPDATE business_settings SET name=?,address=?,phone=? WHERE id=1').run(b.name.trim(),b.address.trim(),b.phone.trim());auth.audit('Factory details updated');res.end(JSON.stringify({...operations.enrich(),business:business()}));
  }
  if(url.pathname==='/api/images'){
   assert(typeof b.data==='string','Select an image');const match=b.data.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);assert(match,'Choose a PNG, JPEG or WebP image');const buffer=Buffer.from(match[2],'base64');assert(buffer.length>0&&buffer.length<=4*1024*1024,'Image must be under 4 MB');assert(type(buffer)===match[1],'The image file format is invalid');const id=randomUUID();db.prepare('INSERT INTO images VALUES(?,?,?,?)').run(id,match[1],buffer,new Date().toISOString());res.end(JSON.stringify({id}));
  }
  return true;
 }
 return {handle,business,audit:auth.audit,operations};
}
