import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {openStore} from '../database.js';
import {createAuth} from '../auth.js';
import {createOperations} from '../operations.js';

function fixture(){const root=mkdtempSync(path.join(tmpdir(),'factory-workflow-'));const store=openStore(':memory:');const auth=createAuth(store.db);const ops=createOperations(store,root,auth);auth.setup('839201',{setHeader(){}});store.write({products:[{id:1,sku:'SOAP-1',name:'Soap',variant:'Lime',size:'100 g',category:'Soap bars',price:100,stock:20,minimum:5}],customers:[{id:1,name:'Test shop',area:'Colombo',phone:''}],orders:[{id:1,reference:'LM-0001',customerId:1,total:500,paid:500,status:'Placed',date:'2026-10-01T08:00:00Z',notes:'',items:[{productId:1,name:'Soap',variant:'Lime',size:'100 g',quantity:5,price:100}]},{id:2,reference:'LM-0002',customerId:1,total:200,paid:0,status:'Placed',date:'2026-10-02T08:00:00Z',notes:'',items:[{productId:1,name:'Soap',variant:'Lime',size:'100 g',quantity:2,price:100}]}],movements:[]});const run=(route,body)=>{const [label,fn]=ops.actions['/api/'+route];ops.transaction(label,body.requestId||randomUUID(),()=>fn(body));return ops.enrich()};return {root,store,ops,auth,run,close(){store.close();rmSync(root,{recursive:true,force:true})}}}

test('returns, refunds and transferred credits reconcile stock and shop statements',()=>{const f=fixture();try{
 const body={id:1,revision:0,reason:'Shop return',items:[{productId:1,quantity:2,disposition:'restock'}],requestId:randomUUID()};let s=f.run('returns',body);assert.equal(s.products[0].stock,22);assert.equal(s.orders.find(o=>o.id===1).creditBalance,200);assert.equal(s.orders.find(o=>o.id===1).items[0].returned,2);
 s=f.run('returns',body);assert.equal(s.products[0].stock,22);assert.equal(s.credits.length,1);
 assert.throws(()=>f.run('returns',{...body,requestId:randomUUID(),revision:1,items:[{productId:1,quantity:4,disposition:'restock'}]}),/quantity/);assert.equal(f.ops.enrich().products[0].stock,22);
 s=f.run('refund',{id:1,revision:1,amount:50,reason:'Cash refund'});assert.equal(s.orders.find(o=>o.id===1).creditBalance,150);
 assert.throws(()=>f.run('refund',{id:1,amount:151,reason:'Too much'}),/Refund/);
 s=f.run('apply-credit',{id:2,fromOrder:1,revision:0,amount:100});assert.equal(s.orders.find(o=>o.id===1).creditBalance,50);assert.equal(s.orders.find(o=>o.id===2).due,100);
 s=f.run('credit-note',{id:2,revision:1,amount:20,reason:'Agreed discount'});assert.equal(s.orders.find(o=>o.id===2).due,80);
 assert.equal(f.ops.statement(1).balance,30);assert.equal(s.orders.reduce((a,o)=>a+o.due-o.creditBalance,0),30);
 const current=s.orders.find(o=>o.id===1);s=f.run('returns',{id:1,revision:current.revision,reason:'Damaged packaging',items:[{productId:1,quantity:1,disposition:'damaged'}]});assert.equal(s.products[0].stock,22);assert.equal(s.returns.length,2);
 }finally{f.close()}});

test('corrections preserve revisions, stock differences and overpayment credit',()=>{const f=fixture();try{
 let s=f.run('correct-order',{id:1,revision:0,customerId:1,items:[{productId:1,quantity:4,price:100}],reason:'Quantity was entered incorrectly',notes:'Corrected'});assert.equal(s.products[0].stock,21);assert.equal(s.orders.find(o=>o.id===1).total,400);assert.equal(s.orders.find(o=>o.id===1).creditBalance,100);
 assert.throws(()=>f.run('correct-order',{id:1,revision:0,customerId:1,items:[{productId:1,quantity:3,price:100}],reason:'Stale form'}),/changed/);
 assert.equal(f.store.db.prepare('SELECT count(*) AS n FROM order_revisions').get().n,1);
 s=f.run('refund',{id:1,revision:1,amount:100,reason:'Refund after correction'});assert.equal(s.orders.find(o=>o.id===1).creditBalance,0);assert.equal(f.ops.statement(1).balance,200);
 assert.throws(()=>f.run('archive',{kind:'product',id:1,archived:true}),/remaining stock/);assert.throws(()=>f.run('archive',{kind:'shop',id:1,archived:true}),/Settle/);
 const before=f.ops.enrich();assert.throws(()=>f.run('correct-order',{id:2,revision:0,customerId:1,items:[{productId:1,quantity:999,price:100}],reason:'Oversold'}),/Insufficient/);assert.deepEqual(f.ops.enrich(),before);
 }finally{f.close()}});

test('CSV imports are validated as a whole, with collectable opening balances',()=>{const f=fixture();try{
 const rows=[{code:'OLD-SHOP',name:'Imported shop',area:'Galle',phone:'0771234567'}];assert.equal(f.ops.importPreview('shops',rows).errors.length,0);f.run('import/commit',{kind:'shops',rows});
 const balances=[{shop_code:'OLD-SHOP',reference:'PAPER-001',amount:'1000.50',date:'2026-09-30'}];let s=f.run('import/commit',{kind:'balances',rows:balances});const opening=s.openingBalances[0];assert.equal(opening.due,1000.5);
 s=f.run('opening-entry',{id:opening.id,amount:400.5,kind:'Payment'});s=f.run('opening-entry',{id:opening.id,amount:100,kind:'Credit',reason:'Paper account adjustment'});assert.equal(s.openingBalances[0].due,500);assert.equal(f.ops.statement(opening.customerId).balance,500);
 const bad=[{sku:'NEW',name:'New',variant:'Rose',size:'100 g',category:'Soap bars',price:'100',stock:'2',minimum:'1'},{sku:'SOAP-1',name:'Duplicate',variant:'Lime',size:'100 g',category:'Soap bars',price:'100',stock:'2',minimum:'1'}];assert.equal(f.ops.importPreview('products',bad).errors[0].row,3);assert.throws(()=>f.run('import/commit',{kind:'products',rows:bad}),/Fix all/);assert.equal(f.ops.enrich().products.length,1);
 assert.throws(()=>f.run('opening-entry',{id:opening.id,amount:501,kind:'Payment'}),/outstanding/);
 }finally{f.close()}});

test('guided restore recovers records, keeps the current PIN and preserves a safety snapshot',()=>{const f=fixture();try{
 f.run('correct-order',{id:1,revision:0,customerId:1,items:[{productId:1,quantity:4,price:100}],reason:'Corrected quantity'});
 const selected=f.ops.snapshot('selected');const preview=f.ops.restorePreview({data:readFileSync(selected).toString('base64')},'test-session');assert.equal(preview.counts.orders,2);
 f.store.db.exec('UPDATE products SET stock=99');f.auth.change('839201','728190',{setHeader(){}});
 assert.throws(()=>f.ops.restoreCommit({token:preview.token,pin:'728190',confirmName:'Wrong name'},'test-session'),/exactly/);
 const result=f.ops.restoreCommit({token:preview.token,pin:'728190',confirmName:preview.name},'test-session');assert.equal(f.ops.enrich().products[0].stock,21);assert.equal(f.ops.enrich().orders.find(o=>o.id===1).creditBalance,100);assert.ok(existsSync(path.join(f.root,'data','backups',result.recovery)));f.auth.verify('728190');assert.equal(f.store.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(f.store.db.prepare('PRAGMA foreign_key_check').all().length,0);
 assert.throws(()=>f.ops.restorePreview({data:Buffer.from('not a database').toString('base64')},'test-session'),/valid SQLite/);
 }finally{f.close()}});
