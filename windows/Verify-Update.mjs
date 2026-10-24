import {spawn} from 'node:child_process';
import {mkdtempSync,cpSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
const oldApp=path.resolve(process.argv[2]),packageFolder=path.resolve(process.argv[3]);
const root=mkdtempSync(path.join(tmpdir(),'ceylon-update-')),app=path.join(root,'Ceylon Pure Homecare');
const pids=new Set();
function run(script,args=[]){return new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script,'-NoBrowser',...args],{env:{...process.env,LOCALAPPDATA:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',error='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>error+=chunk);child.once('error',reject);child.once('exit',code=>code===0?resolve(output.trim()):reject(Error(error||output)));})}
try{
 cpSync(oldApp,app,{recursive:true});
 let url=await run(path.join(app,'Launch.ps1'),['-PreferredPort','43227']);
 let h=await fetch(url+'api/health').then(r=>r.json());pids.add(h.processId);
 let cookie='';const request=async(endpoint,body)=>{const response=await fetch(url+'api/'+endpoint,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'Content-Type':'application/json',Cookie:cookie}});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const value=await response.json();assert.equal(response.status,200,JSON.stringify(value));return value};
 await request('auth/setup',{pin:'839201'});let data=await request('products',{name:'Existing hand wash',variant:'Lime',size:'1 L',category:'Hand wash',price:760,stock:10,minimum:2});const productId=data.products[0].id;
 await request('orders',{saleType:'retail',items:[{productId,quantity:2}],paid:1520});
 const credentials=()=>{const db=new DatabaseSync(path.join(app,'data','inventory.sqlite'),{readOnly:true});try{return db.prepare('SELECT salt,pin_hash FROM credentials').get()}finally{db.close()}};
 const before=credentials(),identity=JSON.parse(readFileSync(path.join(app,'data','launcher.json'),'utf8').replace(/^\uFEFF/,''));
 const oldPid=h.processId;url=await run(path.join(packageFolder,'Setup','Install.ps1'));pids.delete(oldPid);
 h=await fetch(url+'api/health').then(r=>r.json());pids.add(h.processId);assert.equal(h.instanceId,identity.instanceId);
 assert.deepEqual(credentials(),before);await request('auth/login',{pin:'839201'});data=await request('state');assert.equal(data.orders.length,1);assert.equal(data.orders[0].total,1520);assert.equal(data.orders[0].discountAmount,0);assert.equal(data.orders[0].due,0);assert.equal(data.products[0].stock,8);
 assert.equal((await request('database-status')).schemaVersion,5);assert.equal((await fetch(url+'billing.js')).status,200);
 data=await request('orders',{saleType:'retail',items:[{productId,quantity:2}],discountType:'percent',discountValue:10,paid:1368});assert.equal(data.orders[0].total,1368);assert.equal(data.orders.length,2);
 const backups=readdirSync(path.join(app,'data','updates'));assert.equal(backups.length,1);const backup=new DatabaseSync(path.join(app,'data','updates',backups[0],'inventory.sqlite'),{readOnly:true});try{assert.equal(backup.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(backup.prepare('SELECT count(*) AS n FROM orders').get().n,1);assert.deepEqual(backup.prepare('SELECT salt,pin_hash FROM credentials').get(),before)}finally{backup.close()}
 console.log('Installed-version update, database safety backup, unchanged PIN and records, stable shortcut identity and discounted billing verified.');
}finally{for(const pid of pids)try{process.kill(pid)}catch{}await new Promise(resolve=>setTimeout(resolve,300));rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:200})}
