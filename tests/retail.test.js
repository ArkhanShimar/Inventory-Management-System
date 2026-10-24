import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {openStore} from '../database.js';

test('upgrades existing shop orders without losing items, payments, revisions or references',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'factory-retail-migration-')),file=path.join(root,'inventory.sqlite');let db,store;
 try{
  db=new DatabaseSync(file);db.exec(`PRAGMA foreign_keys=ON;
   CREATE TABLE customers(id INTEGER PRIMARY KEY,name TEXT NOT NULL,area TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '') STRICT;
   CREATE TABLE products(id INTEGER PRIMARY KEY,sku TEXT NOT NULL UNIQUE,name TEXT NOT NULL,variant TEXT NOT NULL,size TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,price_cents INTEGER NOT NULL,stock INTEGER NOT NULL,minimum INTEGER NOT NULL) STRICT;
   CREATE TABLE orders(id INTEGER PRIMARY KEY,reference TEXT NOT NULL UNIQUE,customer_id INTEGER NOT NULL REFERENCES customers(id),total_cents INTEGER NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 0,closed_at TEXT) STRICT;
   CREATE TABLE order_items(order_id INTEGER NOT NULL REFERENCES orders(id),product_id INTEGER NOT NULL REFERENCES products(id),name TEXT NOT NULL,variant TEXT NOT NULL,size TEXT NOT NULL,quantity INTEGER NOT NULL,price_cents INTEGER NOT NULL,PRIMARY KEY(order_id,product_id)) STRICT;
   CREATE TABLE payments(id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(id),amount_cents INTEGER NOT NULL,received_at TEXT NOT NULL) STRICT;
   INSERT INTO customers VALUES(1,'Existing shop','Galle','0771234567');
   INSERT INTO products VALUES(1,'CP-01','Soap','Lime','100 g','Soap bars',10000,10,2);
   INSERT INTO orders VALUES(1,'LM-0001',1,10000,'Delivered','2026-10-01','Existing note',3,'2026-10-02');
   INSERT INTO order_items VALUES(1,1,'Soap','Lime','100 g',1,10000);
   INSERT INTO payments VALUES(1,1,5000,'2026-10-01');`);db.close();db=null;
  store=openStore(file);let s=store.read();assert.equal(s.orders[0].paid,50);assert.equal(s.orders[0].saleType,'shop');assert.equal(s.orders[0].customerId,1);assert.equal(s.orders[0].items.length,1);
  assert.equal(store.db.prepare('SELECT revision,closed_at FROM orders').get().revision,3);
  assert.equal(store.db.prepare('SELECT closed_at FROM orders').get().closed_at,'2026-10-02');
  assert.throws(()=>store.db.prepare('INSERT INTO payments(order_id,amount_cents,received_at) VALUES(1,6000,?)').run('2026-10-24'),/exceeds/);
  assert.equal(store.db.prepare('PRAGMA foreign_key_check').all().length,0);
  s.orders.push({id:2,reference:'LM-0002',customerId:null,saleType:'retail',customerName:'Nimal',customerPhone:'0711111111',total:100,paid:100,status:'Delivered',date:'2026-10-24',notes:'Counter sale',items:s.orders[0].items});store.write(s);store.close();store=openStore(file);
  const retail=store.read().orders.find(o=>o.id===2);assert.equal(retail.customerId,null);assert.equal(retail.customerName,'Nimal');assert.equal(retail.customerPhone,'0711111111');assert.equal(retail.paid,100);assert.equal(retail.saleType,'retail');
  assert.equal(store.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 }finally{db?.close();store?.close();rmSync(root,{recursive:true,force:true})}
});

test('walk-in sales work without shops and preserve stock, receipt identity, refunds and account isolation',async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3098',DB_PATH:':memory:'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Retail test server stopped')))});
  let cookie='';const request=async(endpoint,body)=>{const response=await fetch('http://127.0.0.1:3098/api/'+endpoint,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'Content-Type':'application/json',Cookie:cookie}});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,value:await response.json()}};
  await request('auth/setup',{pin:'839201'});
  let result=await request('products',{name:'Soap',variant:'Lime',size:'100 g',category:'Soap bars',price:85.25,stock:20,minimum:2});const productId=result.value.products[0].id;
  const sale={saleType:'retail',items:[{productId,quantity:2}],paid:170.5,requestId:'counter-001'};
  result=await request('orders',{...sale,paid:50});assert.equal(result.status,400);assert.equal((await request('state')).value.products[0].stock,20);
  result=await request('orders',sale);assert.equal(result.status,200,JSON.stringify(result.value));let first=result.value.orders[0];assert.equal(first.saleType,'retail');assert.equal(first.customerId,null);assert.equal(first.status,'Delivered');assert.equal(first.due,0);assert.equal(result.value.customers.length,0);assert.equal(result.value.products[0].stock,18);
  result=await request('orders',sale);assert.equal(result.value.orders.length,1);assert.equal(result.value.products[0].stock,18);
  result=await request('orders',{...sale,requestId:'counter-002',customerName:'  Nimal  ',customerPhone:'0771234567'});assert.equal(result.status,200);const second=result.value.orders[0];assert.equal(second.customerName,'Nimal');assert.equal(second.customerPhone,'0771234567');assert.equal(result.value.products[0].stock,16);
  result=await request('orders',{...sale,requestId:'invalid',customerId:1});assert.equal(result.status,400);
  result=await request('orders',{...sale,requestId:'invalid',items:[{productId,quantity:999}],paid:85164.75});assert.equal(result.status,400);assert.equal((await request('state')).value.products[0].stock,16);
  result=await request('returns',{id:first.id,revision:0,reason:'Counter return',items:[{productId,quantity:1,disposition:'restock'}]});assert.equal(result.status,200,JSON.stringify(result.value));first=result.value.orders.find(o=>o.id===first.id);assert.equal(first.creditBalance,85.25);assert.equal(result.value.products[0].stock,17);
  result=await request('apply-credit',{id:second.id,fromOrder:first.id,amount:85.25});assert.equal(result.status,400);assert.match(result.value.error,/same shop/);
  result=await request('refund',{id:first.id,revision:first.revision,amount:85.25,reason:'Refund to walk-in buyer'});assert.equal(result.status,200);assert.equal(result.value.orders.find(o=>o.id===first.id).creditBalance,0);
  result=await request('customers',{name:'Local shop',area:'Colombo',phone:''});const customerId=result.value.customers[0].id;
  result=await request('orders',{customerId,items:[{productId,quantity:1}],paid:0});assert.equal(result.status,200);assert.equal(result.value.orders[0].saleType,'shop');assert.equal(result.value.orders[0].status,'Placed');assert.equal(result.value.orders[0].due,85.25);
  const statement=await request('statement/'+customerId);assert.equal(statement.value.balance,85.25);assert.equal(result.value.customers.length,1);
  const backup=await fetch('http://127.0.0.1:3098/api/backup',{headers:{Cookie:cookie}});const bytes=Buffer.from(await backup.arrayBuffer());
  result=await request('restore/preview',{data:bytes.toString('base64')});assert.equal(result.status,200);
  result=await request('restore/commit',{token:result.value.token,pin:'839201',confirmName:'Ceylon Pure Homecare'});assert.equal(result.status,200,JSON.stringify(result.value));
  const restored=(await request('state')).value;assert.equal(restored.orders.filter(o=>o.saleType==='retail').length,2);assert.equal(restored.orders.find(o=>o.id===second.id).customerName,'Nimal');assert.equal(restored.products[0].stock,16);
 }finally{child.kill()}
});
