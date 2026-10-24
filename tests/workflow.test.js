import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('orders, payments and cancellations preserve stock',async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3097',DB_PATH:':memory:'},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Server stopped')))});
 let cookie='';
 const request=async(endpoint,body)=>{const r=await fetch('http://127.0.0.1:3097/api/'+endpoint,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'Content-Type':'application/json',Cookie:cookie}});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return{status:r.status,value:await r.json()}};
 assert.equal((await request('state')).status,401);
 const setup=await request('auth/setup',{pin:'123456'});assert.equal(setup.status,200,JSON.stringify(setup.value));
 let result=await request('products',{name:'Test soap',variant:'Lime',size:'100 g',category:'Soap bars',price:85,stock:240,minimum:20});assert.equal(result.status,200,JSON.stringify(result.value));
 result=await request('customers',{name:'Test shop',area:'Colombo',phone:''});assert.equal(result.status,200,JSON.stringify(result.value));
 const customerId=result.value.customers[0].id;
 const initial=(await request('state')).value;const p=initial.products[0];
 result=await request('orders',{customerId,items:[{productId:p.id,quantity:2},{productId:p.id,quantity:3}],paid:100});assert.equal(result.status,200,JSON.stringify(result.value));assert.equal(result.value.products[0].stock,p.stock-5);const order=result.value.orders[0];assert.equal(order.total,p.price*5);assert.equal(order.items.length,1);
 result=await request('orders',{customerId,items:[{productId:p.id,quantity:p.stock+1}],paid:0});assert.equal(result.status,400);assert.equal((await request('state')).value.products[0].stock,p.stock-5);
 result=await request('payment',{id:order.id,amount:order.total});assert.equal(result.status,400);
 result=await request('payment',{id:order.id,amount:order.total-100});assert.equal(result.value.orders[0].paid,order.total);
 result=await request('order-status',{id:order.id,status:'Cancelled'});assert.equal(result.status,400);
 result=await request('orders',{customerId,items:[{productId:p.id,quantity:4}],paid:0});const unpaid=result.value.orders[0];
 result=await request('order-status',{id:unpaid.id,status:'Cancelled'});assert.equal(result.value.products[0].stock,p.stock-5);
 result=await request('order-status',{id:unpaid.id,status:'Cancelled'});assert.equal(result.status,400);
 result=await request('stock',{id:p.id,quantity:-10000,reason:'test'});assert.equal(result.status,400);
 assert.equal((await request('state')).value.products[0].stock,p.stock-5);
 result=await request('settings',{name:'Test Manufacturing',address:'Colombo',phone:'0111234567'});assert.equal(result.value.business.name,'Test Manufacturing');
 result=await request('customers',{id:customerId,name:'Updated shop',area:'Galle',phone:'0771234567'});assert.equal(result.value.customers[0].name,'Updated shop');
 const image=await request('images',{data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='});assert.equal(image.status,200);
 result=await request('products',{...result.value.products[0],imageId:image.value.id});assert.equal(result.value.products[0].imageId,image.value.id);
 assert.equal((await request('images',{data:'data:image/png;base64,PHNjcmlwdD4='})).status,400);
 const oldCookie=cookie;assert.equal((await request('auth/change-pin',{currentPin:'123456',newPin:'654321'})).status,200);const newCookie=cookie;cookie=oldCookie;assert.equal((await request('state')).status,401);cookie=newCookie;
 assert.equal((await request('state')).status,200);await request('auth/logout',{});assert.equal((await request('state')).status,401);
 assert.equal((await request('auth/login',{pin:'123456'})).status,401);assert.equal((await request('auth/login',{pin:'654321'})).status,200);
 const imageResponse=await fetch('http://127.0.0.1:3097/api/images/'+image.value.id,{headers:{Cookie:cookie}});assert.equal(imageResponse.status,200);assert.equal(imageResponse.headers.get('content-type'),'image/png');
 const backupResponse=await fetch('http://127.0.0.1:3097/api/backup',{headers:{Cookie:cookie}});assert.equal(backupResponse.status,200);const bytes=Buffer.from(await backupResponse.arrayBuffer());assert.equal(bytes.subarray(0,15).toString(),'SQLite format 3');
 const folder=mkdtempSync(path.join(tmpdir(),'luma-backup-'));const filename=path.join(folder,'restore.sqlite');let restored;
 try{writeFileSync(filename,bytes);restored=new DatabaseSync(filename,{readOnly:true});assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(restored.prepare('SELECT count(*) AS n FROM images').get().n,1);assert.equal(restored.prepare('SELECT name FROM business_settings').get().name,'Test Manufacturing');assert.equal(restored.prepare('SELECT count(*) AS n FROM payments').get().n,2)}finally{restored?.close();rmSync(folder,{recursive:true,force:true})}
 // Exercise the handover routes through authentication and the real HTTP boundary.
 let current=(await request('state')).value;const liveOrder=current.orders.find(o=>o.id===order.id);
 result=await request('returns',{id:liveOrder.id,revision:liveOrder.revision,reason:'Shop returned one bar',items:[{productId:p.id,quantity:1,disposition:'restock'}],requestId:'return-api-1'});assert.equal(result.status,200,JSON.stringify(result.value));assert.equal(result.value.orders.find(o=>o.id===order.id).creditBalance,85);
 const stockAfter=result.value.products[0].stock;
 result=await request('returns',{id:liveOrder.id,revision:liveOrder.revision,reason:'Shop returned one bar',items:[{productId:p.id,quantity:1,disposition:'restock'}],requestId:'return-api-1'});assert.equal(result.status,200);assert.equal(result.value.products[0].stock,stockAfter);
 result=await request('refund',{id:order.id,amount:85,reason:'Returned cash to shop'});assert.equal(result.status,200,JSON.stringify(result.value));assert.equal(result.value.orders.find(o=>o.id===order.id).creditBalance,0);
 result=await request('statement/'+customerId);assert.equal(result.status,200);assert.equal(result.value.balance,0);
 result=await request('import/preview',{kind:'shops',rows:[{code:'NEW-SHOP',name:'Imported shop',area:'Galle',phone:''}]});assert.equal(result.status,200);assert.equal(result.value.errors.length,0);
 result=await request('import/commit',{kind:'shops',rows:[{code:'NEW-SHOP',name:'Imported shop',area:'Galle',phone:''}],requestId:'import-api-1'});assert.equal(result.status,200);assert.equal(result.value.customers.length,2);
 result=await request('import/commit',{kind:'shops',rows:[{code:'NEW-SHOP',name:'Imported shop',area:'Galle',phone:''}],requestId:'import-api-1'});assert.equal(result.status,200);assert.equal(result.value.customers.length,2);
 const imported=result.value.customers.find(c=>c.code==='NEW-SHOP');result=await request('archive',{kind:'shop',id:imported.id,archived:true});assert.equal(result.status,200);assert.equal(result.value.customers.find(c=>c.id===imported.id).archived,true);
 result=await request('archive',{kind:'shop',id:imported.id,archived:false});assert.equal(result.status,200);assert.equal(result.value.customers.find(c=>c.id===imported.id).archived,false);
 }finally{child.kill()}
});

