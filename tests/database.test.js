import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openStore } from '../database.js';

const fixture=()=>({products:[{id:1,sku:'SOAP-1',name:'Soap',variant:'Lime',size:'100 g',category:'Soap bars',price:85.25,stock:20,minimum:5}],customers:[{id:1,name:'Test shop',area:'Colombo',phone:''}],orders:[{id:1,reference:'LM-0001',customerId:1,total:170.5,paid:50.25,status:'Placed',date:'2026-10-24T08:00:00Z',notes:'',items:[{productId:1,name:'Soap',variant:'Lime',size:'100 g',quantity:2,price:85.25}]}],movements:[{id:1,product:'Soap · Lime',quantity:-2,reason:'Order LM-0001',date:'2026-10-24T08:00:00Z'}]});

test('migrates existing records, persists after reopening, and records each payment',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'luma-db-'));const filename=path.join(dir,'inventory.sqlite');let store;
 try{
  const legacy=new DatabaseSync(filename);legacy.exec('CREATE TABLE state(id INTEGER PRIMARY KEY,value TEXT NOT NULL)');legacy.prepare('INSERT INTO state VALUES(1,?)').run(JSON.stringify(fixture()));legacy.close();
  store=openStore(filename);const expected=fixture();expected.products[0].imageId=null;Object.assign(expected.orders[0],{saleType:'shop',customerName:'',customerPhone:'',subtotal:170.5,discountType:'none',discountValue:0,discountAmount:0});expected.orders[0].items[0].netTotal=170.5;assert.deepEqual(JSON.parse(JSON.stringify(store.read())),expected);
  const next=store.read();next.orders[0].paid=75.5;next.products[0].stock=18;store.write(next);store.close();
  store=openStore(filename);assert.equal(store.read().products[0].stock,18);assert.equal(store.read().orders[0].paid,75.5);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM payments').get().count,2);
  assert.equal(store.db.prepare('SELECT price_cents FROM products').get().price_cents,8525);
  assert.equal(store.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.equal(store.db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{store?.close();rmSync(dir,{recursive:true,force:true})}
});

test('invalid relational writes roll back every table',()=>{
 const store=openStore(':memory:');try{store.write(fixture());const before=store.read();const invalid=store.read();invalid.products[0].stock=1;invalid.orders[0].paid=999;
 assert.throws(()=>store.write(invalid),/exceeds/);assert.deepEqual(store.read(),before);
 const invalidCustomer=store.read();invalidCustomer.orders.push({...invalidCustomer.orders[0],id:2,reference:'LM-0002',customerId:999});
 assert.throws(()=>store.write(invalidCustomer),/FOREIGN KEY/);assert.deepEqual(store.read(),before);
 }finally{store.close()}
});

test('new databases start empty without hardcoded business data',()=>{
 const store=openStore(':memory:');try{assert.deepEqual(store.read(),{products:[],customers:[],orders:[],movements:[]})}finally{store.close()}
});
