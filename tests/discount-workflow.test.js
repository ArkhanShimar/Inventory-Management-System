import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openStore} from '../database.js';

test('discounted retail and shop bills persist, collect and refund the actual discounted amounts',async()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ceylon-discounts-')),file=path.join(folder,'inventory.sqlite');let store;
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3095',DB_PATH:file},windowsHide:true,stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Discount test server stopped')))});
  let cookie='';const request=async(endpoint,body)=>{const response=await fetch('http://127.0.0.1:3095/api/'+endpoint,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'Content-Type':'application/json',Cookie:cookie}});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,value:await response.json()}};
  await request('auth/setup',{pin:'839201'});
  let result=await request('products',{name:'Hand wash',variant:'Lime',size:'1 L',category:'Hand wash',price:760,stock:40,minimum:2});const productId=result.value.products[0].id;
  const body={saleType:'retail',items:[{productId,quantity:2}],discountType:'percent',discountValue:10,paid:1368,requestId:'discount-retail'};
  result=await request('orders',body);assert.equal(result.status,200,JSON.stringify(result.value));let retail=result.value.orders[0];assert.equal(retail.subtotal,1520);assert.equal(retail.discountAmount,152);assert.equal(retail.total,1368);assert.equal(retail.paid,1368);assert.equal(retail.due,0);assert.equal(retail.items[0].netTotal,1368);
  result=await request('orders',body);assert.equal(result.value.orders.length,1);assert.equal(result.value.products[0].stock,38);
  for(const invalid of [{discountValue:101},{discountType:'amount',discountValue:2000},{discountValue:-10},{discountValue:1.001},{paid:1520}]){result=await request('orders',{...body,...invalid,requestId:undefined});assert.equal(result.status,400)}
  assert.equal((await request('state')).value.products[0].stock,38);
  result=await request('orders',{...body,discountType:'amount',discountValue:100,paid:1420,requestId:'discount-amount'});assert.equal(result.status,200);assert.equal(result.value.orders[0].total,1420);
  result=await request('returns',{id:retail.id,revision:retail.revision,reason:'Return one bottle',items:[{productId,quantity:1,disposition:'restock'}]});assert.equal(result.status,200,JSON.stringify(result.value));retail=result.value.orders.find(o=>o.id===retail.id);assert.equal(retail.creditBalance,684);
  assert.equal((await request('refund',{id:retail.id,amount:760,reason:'Too much'})).status,400);
  result=await request('refund',{id:retail.id,revision:retail.revision,amount:684,reason:'Cash refunded'});assert.equal(result.status,200);
  result=await request('returns',{id:retail.id,reason:'Return second bottle',items:[{productId,quantity:1,disposition:'restock'}]});assert.equal(result.status,200);retail=result.value.orders.find(o=>o.id===retail.id);assert.equal(retail.credited,1368);assert.equal(retail.netTotal,0);assert.equal(retail.creditBalance,684);
  result=await request('refund',{id:retail.id,amount:684,reason:'Remaining cash refund'});assert.equal(result.value.orders.find(o=>o.id===retail.id).creditBalance,0);
  result=await request('customers',{name:'Discount shop',area:'Galle',phone:''});const customerId=result.value.customers[0].id;
  result=await request('orders',{customerId,items:[{productId,quantity:2}],discountType:'percent',discountValue:10,paid:500});assert.equal(result.status,200);let shop=result.value.orders[0];assert.equal(shop.due,868);
  result=await request('correct-order',{id:shop.id,revision:shop.revision,customerId,items:[{productId,quantity:3,price:760}],reason:'One extra bottle'});assert.equal(result.status,200,JSON.stringify(result.value));shop=result.value.orders.find(o=>o.id===shop.id);assert.equal(shop.discountAmount,228);assert.equal(shop.total,2052);assert.equal(shop.due,1552);
  result=await request('correct-order',{id:shop.id,revision:shop.revision,customerId,items:[{productId,quantity:3,price:760}],discountType:'amount',discountValue:100,reason:'Agreed fixed discount'});assert.equal(result.status,200);shop=result.value.orders.find(o=>o.id===shop.id);assert.equal(shop.total,2180);assert.equal(shop.due,1680);
  assert.equal((await request('payment',{id:shop.id,amount:1680})).status,200);assert.equal((await request('statement/'+customerId)).value.balance,0);
  const backup=await fetch('http://127.0.0.1:3095/api/backup',{headers:{Cookie:cookie}});const bytes=Buffer.from(await backup.arrayBuffer());result=await request('restore/preview',{data:bytes.toString('base64')});
  result=await request('restore/commit',{token:result.value.token,pin:'839201',confirmName:'Ceylon Pure Homecare'});assert.equal(result.status,200,JSON.stringify(result.value));
  const saved=(await request('state')).value.orders.find(o=>o.id===shop.id);assert.equal(saved.discountType,'amount');assert.equal(saved.discountAmount,100);assert.equal(saved.subtotal,2280);assert.equal(saved.due,0);
  await new Promise(resolve=>{child.once('exit',resolve);child.kill()});store=openStore(file);const persisted=store.read().orders.find(o=>o.id===shop.id);assert.equal(persisted.discountValue,100);assert.equal(persisted.items[0].netTotal,2180);assert.equal(store.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 }finally{if(child.exitCode===null)child.kill();store?.close();rmSync(folder,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
});
