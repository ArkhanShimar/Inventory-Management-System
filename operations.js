import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {mkdirSync,existsSync,writeFileSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {calculateBill,returnValue} from './public/billing.js';

const cents=n=>Math.round(n*100);
const now=()=>new Date().toISOString();
const fail=(ok,message)=>{if(!ok)throw Error(message)};
const money=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e10&&Math.abs(n*100-Math.round(n*100))<0.0001;
const reason=s=>typeof s==='string'&&s.trim().length>=3&&s.length<=500;
const positive=n=>Number.isSafeInteger(n)&&n>0&&n<=1e9;
const categories=['Soap bars','Dishwashing','Hand wash','Washing powder','Fabric care'];

export function createOperations(store,root,auth){
 const db=store.db;
 function addColumn(table,name,definition){if(!db.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name===name))db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)}
 addColumn('products','archived','INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1))');
 addColumn('customers','archived','INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1))');
 addColumn('customers','code','TEXT');
 addColumn('orders','revision','INTEGER NOT NULL DEFAULT 0');
 addColumn('orders','closed_at','TEXT');
 db.exec(`UPDATE customers SET code='SHOP-'||printf('%04d',id) WHERE code IS NULL;
 CREATE UNIQUE INDEX IF NOT EXISTS customers_code ON customers(code COLLATE NOCASE);
 CREATE TABLE IF NOT EXISTS credit_notes(id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),kind TEXT NOT NULL CHECK(kind IN ('Return','Adjustment')),reason TEXT NOT NULL,created_at TEXT NOT NULL) STRICT;
 CREATE TABLE IF NOT EXISTS return_items(id INTEGER PRIMARY KEY,credit_id INTEGER NOT NULL REFERENCES credit_notes(id),order_id INTEGER NOT NULL REFERENCES orders(id),product_id INTEGER NOT NULL REFERENCES products(id),quantity INTEGER NOT NULL CHECK(quantity>0),disposition TEXT NOT NULL CHECK(disposition IN ('restock','damaged')),price_cents INTEGER NOT NULL CHECK(price_cents>=0)) STRICT;
 CREATE TABLE IF NOT EXISTS refunds(id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),reason TEXT NOT NULL,created_at TEXT NOT NULL) STRICT;
 CREATE TABLE IF NOT EXISTS credit_transfers(id INTEGER PRIMARY KEY,from_order INTEGER NOT NULL REFERENCES orders(id),to_order INTEGER NOT NULL REFERENCES orders(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),created_at TEXT NOT NULL,CHECK(from_order!=to_order)) STRICT;
 CREATE TABLE IF NOT EXISTS order_revisions(id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(id),reason TEXT NOT NULL,before_json TEXT NOT NULL,after_json TEXT NOT NULL,created_at TEXT NOT NULL) STRICT;
 CREATE TABLE IF NOT EXISTS opening_balances(id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),reference TEXT NOT NULL UNIQUE,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),created_at TEXT NOT NULL) STRICT;
 CREATE TABLE IF NOT EXISTS opening_entries(id INTEGER PRIMARY KEY,balance_id INTEGER NOT NULL REFERENCES opening_balances(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),kind TEXT NOT NULL CHECK(kind IN ('Payment','Credit')),reason TEXT NOT NULL,created_at TEXT NOT NULL) STRICT;
 CREATE TABLE IF NOT EXISTS processed_requests(request_key TEXT PRIMARY KEY,created_at TEXT NOT NULL) STRICT;
 CREATE INDEX IF NOT EXISTS credit_order ON credit_notes(order_id);
 CREATE INDEX IF NOT EXISTS return_order ON return_items(order_id,product_id);
 CREATE INDEX IF NOT EXISTS refunds_order ON refunds(order_id);
 INSERT OR IGNORE INTO schema_migrations VALUES(3,datetime('now'));`);

 function enrich(s=store.read()){
  const productMeta=new Map(db.prepare('SELECT id,archived FROM products').all().map(r=>[r.id,r]));
  const customerMeta=new Map(db.prepare('SELECT id,archived,code FROM customers').all().map(r=>[r.id,r]));
  const orderMeta=new Map(db.prepare('SELECT id,revision,closed_at AS closedAt FROM orders').all().map(r=>[r.id,r]));
  const credits=db.prepare('SELECT id,order_id AS orderId,amount_cents/100.0 AS amount,kind,reason,created_at AS date FROM credit_notes ORDER BY id').all();
  const refunds=db.prepare('SELECT id,order_id AS orderId,amount_cents/100.0 AS amount,reason,created_at AS date FROM refunds ORDER BY id').all();
  const transfers=db.prepare('SELECT id,from_order AS fromOrder,to_order AS toOrder,amount_cents/100.0 AS amount,created_at AS date FROM credit_transfers ORDER BY id').all();
  const returns=db.prepare('SELECT id,credit_id AS creditId,order_id AS orderId,product_id AS productId,quantity,disposition,price_cents/100.0 AS price FROM return_items').all();
  const payments=db.prepare('SELECT id,order_id AS orderId,amount_cents/100.0 AS amount,received_at AS date FROM payments ORDER BY id').all();
  const sum=(rows,predicate)=>rows.filter(predicate).reduce((a,r)=>a+cents(r.amount),0);
  for(const p of s.products)p.archived=!!productMeta.get(p.id)?.archived;
  for(const c of s.customers)Object.assign(c,{archived:!!customerMeta.get(c.id)?.archived,code:customerMeta.get(c.id)?.code||`SHOP-${String(c.id).padStart(4,'0')}`});
  for(const o of s.orders){const credited=sum(credits,r=>r.orderId===o.id),refunded=sum(refunds,r=>r.orderId===o.id),incoming=sum(transfers,r=>r.toOrder===o.id),outgoing=sum(transfers,r=>r.fromOrder===o.id);const netTotal=o.status==='Cancelled'?0:Math.max(0,cents(o.total)-credited),netPaid=cents(o.paid)-refunded+incoming-outgoing;
   Object.assign(o,orderMeta.get(o.id),{credited:credited/100,refunded:refunded/100,creditApplied:incoming/100,creditTransferred:outgoing/100,netTotal:netTotal/100,netPaid:netPaid/100,due:Math.max(0,netTotal-netPaid)/100,creditBalance:Math.max(0,netPaid-netTotal)/100});
   for(const item of o.items)item.returned=returns.filter(r=>r.orderId===o.id&&r.productId===item.productId).reduce((a,r)=>a+r.quantity,0);
  }
  const opening=db.prepare(`SELECT b.id,b.customer_id AS customerId,b.reference,b.amount_cents/100.0 AS amount,b.created_at AS date,
   (b.amount_cents-COALESCE((SELECT SUM(amount_cents) FROM opening_entries e WHERE e.balance_id=b.id),0))/100.0 AS due FROM opening_balances b ORDER BY id`).all();
  const openingEntries=db.prepare('SELECT id,balance_id AS balanceId,amount_cents/100.0 AS amount,kind,reason,created_at AS date FROM opening_entries ORDER BY id').all();
  return {...s,credits,refunds,transfers,returns,payments,openingBalances:opening,openingEntries};
 }
 function snapshot(prefix='before-change'){
  const folder=path.join(root,'data','backups');mkdirSync(folder,{recursive:true});const target=path.join(folder,`${prefix}-${Date.now()}-${randomUUID().slice(0,8)}.sqlite`);db.prepare('VACUUM INTO ?').run(target);return target;
 }
 function transaction(action,requestId,fn){
  const key=requestId?`${action}:${requestId}`:null;
  if(key&&db.prepare('SELECT request_key FROM processed_requests WHERE request_key=?').get(key))return;
  db.exec('BEGIN IMMEDIATE');try{fn();auth.audit(action);if(key)db.prepare('INSERT INTO processed_requests VALUES(?,?)').run(key,now());db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
 }
 function order(id,revision){const o=enrich().orders.find(o=>o.id===id);fail(o&&o.status!=='Cancelled','Order not available');if(revision!==undefined)fail(o.revision===revision,'This record changed. Close this form and open it again.');return o}
 function movement(product,quantity,description){const id=db.prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM stock_movements').get().id;db.prepare('INSERT INTO stock_movements VALUES(?,?,?,?,?,?)').run(randomUUID(),id,product,quantity,description,now())}
 function revision(id){db.prepare('UPDATE orders SET revision=revision+1 WHERE id=?').run(id)}
 function archive(b){
  fail(['product','shop'].includes(b.kind),'Choose a valid record');fail(typeof b.archived==='boolean','Choose a valid archive state');const table=b.kind==='product'?'products':'customers';const row=db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(b.id);fail(row,'Record not found');
  if(b.archived&&b.kind==='product')fail(row.stock===0,'Remove remaining stock with a recorded adjustment before archiving.');
  if(b.archived&&b.kind==='shop'){const s=enrich();fail(!s.orders.some(o=>o.customerId===b.id&&(o.due>0||o.creditBalance>0||o.status==='Placed'))&&!s.openingBalances.some(o=>o.customerId===b.id&&o.due>0),'Settle this shop’s orders, balances and credits before archiving.');}
  db.prepare(`UPDATE ${table} SET archived=? WHERE id=?`).run(b.archived?1:0,b.id);
 }
 function returnGoods(b){
  const o=order(b.id,b.revision);fail(reason(b.reason),'Enter a reason with at least 3 characters.');fail(Array.isArray(b.items)&&b.items.length>0,'Choose at least one item to return');const seen=new Set();let credit=0;
  for(const row of b.items){fail(!seen.has(row.productId),'Each product can appear only once');seen.add(row.productId);const item=o.items.find(i=>i.productId===row.productId);fail(item&&positive(row.quantity)&&row.quantity<=item.quantity-item.returned,'Return quantity exceeds the quantity still eligible');fail(['restock','damaged'].includes(row.disposition),'Choose the condition of returned goods');credit+=cents(returnValue(item,row.quantity));}
  fail(credit>0&&credit<=cents(o.netTotal),'Return credit exceeds the remaining invoice value');
  const creditId=Number(db.prepare('INSERT INTO credit_notes(order_id,amount_cents,kind,reason,created_at) VALUES(?,?,?,?,?)').run(o.id,credit,'Return',b.reason.trim(),now()).lastInsertRowid);
  for(const row of b.items){const item=o.items.find(i=>i.productId===row.productId);db.prepare('INSERT INTO return_items(credit_id,order_id,product_id,quantity,disposition,price_cents) VALUES(?,?,?,?,?,?)').run(creditId,o.id,item.productId,row.quantity,row.disposition,cents(item.price));if(row.disposition==='restock'){db.prepare('UPDATE products SET stock=stock+?,archived=0 WHERE id=?').run(row.quantity,item.productId);movement(item.name+' · '+item.variant,row.quantity,'Return '+o.reference)}}revision(o.id);
 }
 function creditNote(b){const o=order(b.id,b.revision);fail(money(b.amount)&&b.amount>0&&cents(b.amount)<=cents(o.netTotal),'Credit must not exceed the remaining invoice value');fail(reason(b.reason),'Enter a reason with at least 3 characters.');db.prepare('INSERT INTO credit_notes(order_id,amount_cents,kind,reason,created_at) VALUES(?,?,?,?,?)').run(o.id,cents(b.amount),'Adjustment',b.reason.trim(),now());revision(o.id)}
 function refund(b){const o=order(b.id,b.revision);fail(money(b.amount)&&b.amount>0&&cents(b.amount)<=cents(o.creditBalance),'Refund must not exceed the available refund balance');fail(reason(b.reason),'Enter a reason with at least 3 characters.');db.prepare('INSERT INTO refunds(order_id,amount_cents,reason,created_at) VALUES(?,?,?,?)').run(o.id,cents(b.amount),b.reason.trim(),now());revision(o.id)}
 function transfer(b){const source=order(b.fromOrder),target=order(b.id,b.revision);fail(source.saleType!=='retail'&&target.saleType!=='retail'&&source.customerId!=null&&source.id!==target.id&&source.customerId===target.customerId,'Choose credit from the same shop');fail(money(b.amount)&&b.amount>0&&cents(b.amount)<=cents(source.creditBalance)&&cents(b.amount)<=cents(target.due),'Amount exceeds the available credit or outstanding balance');db.prepare('INSERT INTO credit_transfers(from_order,to_order,amount_cents,created_at) VALUES(?,?,?,?)').run(source.id,target.id,cents(b.amount),now());revision(source.id);revision(target.id)}
 function correct(b){
  const o=order(b.id,b.revision);fail(o.status==='Placed','Only placed orders can be corrected');fail(!db.prepare('SELECT id FROM credit_notes WHERE order_id=?').get(o.id),'Orders with returns or credits cannot be rewritten');fail(reason(b.reason),'Enter a reason with at least 3 characters.');fail(Array.isArray(b.items)&&b.items.length>0&&b.items.length<=100,'Add at least one product');
  const customer=db.prepare('SELECT * FROM customers WHERE id=?').get(b.customerId);fail(customer&&!customer.archived,'Choose an active shop');fail(b.customerId===o.customerId||(o.paid===0&&o.netPaid===0&&!db.prepare('SELECT id FROM credit_transfers WHERE from_order=? OR to_order=?').get(o.id,o.id)),'A paid order cannot be moved to a different shop');
  const items=[],seen=new Set();let total=0;
  for(const row of b.items){fail(!seen.has(row.productId),'Each product can appear only once');seen.add(row.productId);const p=db.prepare('SELECT * FROM products WHERE id=?').get(row.productId),old=o.items.find(i=>i.productId===row.productId);fail(p&&(!p.archived||old),'Choose an active product');fail(positive(row.quantity)&&money(row.price),'Enter valid prices and whole stock quantities');const delta=(old?.quantity||0)-row.quantity;fail(p.stock+delta>=0,'Insufficient stock');total+=cents(row.price)*row.quantity;items.push({productId:p.id,name:old?.name||p.name,variant:old?.variant||p.variant,size:old?.size||p.size,quantity:row.quantity,price:row.price});}
  fail(total>0&&total<=1e12,'Enter a valid order total');
  const bill=calculateBill(items,b.discountType??o.discountType,b.discountValue??o.discountValue);total=cents(bill.total);for(let index=0;index<items.length;index++)items[index].netTotal=bill.items[index].netTotal;
  for(const id of new Set([...o.items.map(i=>i.productId),...items.map(i=>i.productId)])){const old=o.items.find(i=>i.productId===id),next=items.find(i=>i.productId===id),delta=(old?.quantity||0)-(next?.quantity||0);if(delta){db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(delta,id);movement((old||next).name+' · '+(old||next).variant,delta,'Correction '+o.reference)}}
  db.prepare('DELETE FROM order_items WHERE order_id=?').run(o.id);for(const i of items)db.prepare('INSERT INTO order_items(order_id,product_id,name,variant,size,quantity,price_cents,net_total_cents) VALUES(?,?,?,?,?,?,?,?)').run(o.id,i.productId,i.name,i.variant,i.size,i.quantity,cents(i.price),cents(i.netTotal));
  db.prepare('UPDATE orders SET customer_id=?,total_cents=?,subtotal_cents=?,discount_type=?,discount_value=?,discount_cents=?,notes=?,revision=revision+1 WHERE id=?').run(b.customerId,total,cents(bill.subtotal),bill.discountType,bill.discountValue,cents(bill.discountAmount),typeof b.notes==='string'?b.notes.slice(0,2000):o.notes,o.id);
  db.prepare('INSERT INTO order_revisions(order_id,reason,before_json,after_json,created_at) VALUES(?,?,?,?,?)').run(o.id,b.reason.trim(),JSON.stringify(o),JSON.stringify({customerId:b.customerId,...bill}),now());
 }
 function status(b){const o=order(b.id,b.revision);fail(o.status==='Placed','Only placed orders can be updated');fail(['Delivered','Cancelled'].includes(b.status),'Invalid status');if(b.status==='Cancelled'){fail(o.paid===0&&o.credited===0&&!db.prepare('SELECT id FROM credit_transfers WHERE to_order=? OR from_order=?').get(o.id,o.id),'Only unpaid orders without credits can be cancelled');for(const item of o.items){db.prepare('UPDATE products SET stock=stock+?,archived=0 WHERE id=?').run(item.quantity,item.productId);movement(item.name+' · '+item.variant,item.quantity,'Cancelled '+o.reference)}}db.prepare('UPDATE orders SET status=?,closed_at=?,revision=revision+1 WHERE id=?').run(b.status,now(),o.id)}
 function openingEntry(b){const balance=enrich().openingBalances.find(x=>x.id===b.id);fail(balance,'Record not found');fail(money(b.amount)&&b.amount>0&&cents(b.amount)<=cents(balance.due),'Enter a payment within the outstanding balance');fail(['Payment','Credit'].includes(b.kind),'Choose a valid entry type');fail(b.kind==='Payment'||reason(b.reason),'Enter a reason with at least 3 characters.');db.prepare('INSERT INTO opening_entries(balance_id,amount_cents,kind,reason,created_at) VALUES(?,?,?,?,?)').run(b.id,cents(b.amount),b.kind,b.reason||'Opening balance payment',now())}

 function importPreview(kind,rows){
  fail(['products','shops','balances'].includes(kind)&&Array.isArray(rows)&&rows.length>0&&rows.length<=2000,'Choose a CSV with 1 to 2000 records');const errors=[],normalized=[],seen=new Set();
  rows.forEach((row,index)=>{try{const clean=Object.fromEntries(Object.entries(row).map(([k,v])=>[k.trim().toLowerCase(),String(v??'').trim()]));
   const numeric=(key)=>{fail(clean[key]!==undefined&&clean[key]!=='',`Missing value: ${key}`);const n=Number(clean[key]);fail(Number.isFinite(n),`Invalid number: ${key}`);return n};
   const required=(key,max=150)=>{fail(clean[key]&&clean[key].length<=max,`Missing or invalid value: ${key}`);return clean[key]};let record,key;
   if(kind==='products'){key=required('sku',50).toUpperCase();fail(!db.prepare('SELECT id FROM products WHERE lower(sku)=lower(?)').get(key),'Product code already exists');record={sku:key,name:required('name'),variant:required('variant'),size:required('size',80),category:required('category',80),price:numeric('price'),stock:numeric('stock'),minimum:numeric('minimum')};fail(categories.includes(record.category),'Choose a valid product category');fail(money(record.price)&&Number.isSafeInteger(record.stock)&&record.stock>=0&&record.stock<=1e9&&Number.isSafeInteger(record.minimum)&&record.minimum>=0,'Enter valid prices and whole stock quantities')}
   if(kind==='shops'){key=required('code',50).toUpperCase();fail(!db.prepare('SELECT id FROM customers WHERE code=? COLLATE NOCASE').get(key),'Shop code already exists');record={code:key,name:required('name'),area:clean.area||'',phone:clean.phone||''};fail(record.area.length<=200&&record.phone.length<=50,'Enter valid contact details')}
   if(kind==='balances'){key=required('reference',80);fail(!db.prepare('SELECT id FROM opening_balances WHERE reference=?').get(key),'Balance reference already exists');const customer=db.prepare('SELECT id,archived FROM customers WHERE code=? COLLATE NOCASE').get(required('shop_code',50));fail(customer&&!customer.archived,'Shop code was not found');const amount=numeric('amount'),date=required('date',10);fail(money(amount)&&amount>0,'Enter a valid opening balance');fail(/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date,'Use a valid date in YYYY-MM-DD format');record={reference:key,customerId:customer.id,amount,date}}
   fail(!seen.has(key.toLowerCase()),'Duplicate code or reference in this file');seen.add(key.toLowerCase());normalized.push(record);
  }catch(e){errors.push({row:index+2,message:e.message})}});
  return {kind,rows:normalized,errors,total:rows.length};
 }
 function importCommit(b){const preview=importPreview(b.kind,b.rows);fail(preview.errors.length===0,'Fix all import errors before saving');for(const row of preview.rows){if(b.kind==='products'){const id=Number(db.prepare('INSERT INTO products(sku,name,variant,size,category,price_cents,stock,minimum) VALUES(?,?,?,?,?,?,?,?)').run(row.sku,row.name,row.variant,row.size,row.category,cents(row.price),row.stock,row.minimum).lastInsertRowid);if(row.stock)movement(row.name+' · '+row.variant,row.stock,'Opening stock')}
  if(b.kind==='shops')db.prepare('INSERT INTO customers(name,area,phone,code) VALUES(?,?,?,?)').run(row.name,row.area,row.phone,row.code);
  if(b.kind==='balances')db.prepare('INSERT INTO opening_balances(customer_id,reference,amount_cents,created_at) VALUES(?,?,?,?)').run(row.customerId,row.reference,cents(row.amount),new Date(row.date+'T00:00:00+05:30').toISOString());}}

 function statement(customerId){
  const s=enrich();const customer=s.customers.find(c=>c.id===customerId);fail(customer,'Shop not found');const events=[];
  const event=(date,reference,description,debit=0,credit=0)=>events.push({date,reference,description,debit,credit});
  for(const o of s.orders.filter(o=>o.customerId===customerId)){
   const changes=db.prepare('SELECT * FROM order_revisions WHERE order_id=? ORDER BY id').all(o.id);const original=changes.length?JSON.parse(changes[0].before_json).total:o.total;event(o.date,o.reference,'Order',original,0);
   for(const change of changes){const before=JSON.parse(change.before_json),after=JSON.parse(change.after_json),delta=cents(after.total)-cents(before.total);if(delta)event(change.created_at,o.reference,'Order correction',Math.max(0,delta)/100,Math.max(0,-delta)/100)}
   if(o.status==='Cancelled')event(o.closedAt||o.date,o.reference,'Cancelled',0,o.total);
   for(const p of s.payments.filter(p=>p.orderId===o.id))event(p.date,o.reference,'Payment received',0,p.amount);
   for(const c of s.credits.filter(c=>c.orderId===o.id))event(c.date,o.reference,c.kind==='Return'?'Return credit':'Credit adjustment',0,c.amount);
   for(const r of s.refunds.filter(r=>r.orderId===o.id))event(r.date,o.reference,'Refund',r.amount,0);
   for(const t of s.transfers.filter(t=>t.fromOrder===o.id))event(t.date,o.reference,'Credit transferred',t.amount,0);
   for(const t of s.transfers.filter(t=>t.toOrder===o.id))event(t.date,o.reference,'Credit applied',0,t.amount);
  }
  for(const b of s.openingBalances.filter(b=>b.customerId===customerId)){event(b.date,b.reference,'Opening balance',b.amount,0);for(const e of s.openingEntries.filter(e=>e.balanceId===b.id))event(e.date,b.reference,e.kind==='Payment'?'Payment received':'Credit adjustment',0,e.amount)}
  events.sort((a,b)=>a.date.localeCompare(b.date));let running=0;for(const e of events){running+=cents(e.debit)-cents(e.credit);e.balance=running/100}return {customer,events,balance:running/100};
 }

 const staged=new Map();
 const restoreTables=['business_settings','images','products','customers','orders','order_items','payments','stock_movements','credit_notes','return_items','refunds','credit_transfers','order_revisions','opening_balances','opening_entries'];
 function restorePreview(b,key){
  for(const [token,item] of staged)if(item.expires<Date.now()){if(existsSync(item.file))unlinkSync(item.file);staged.delete(token)}
  fail(typeof b.data==='string'&&b.data.length<=57e6,'Choose a database backup under 40 MB');const bytes=Buffer.from(b.data,'base64');fail(bytes.length<=40*1024*1024&&bytes.subarray(0,16).toString()==='SQLite format 3\0','Choose a valid SQLite backup');
  const folder=path.join(root,'data','restore-staging');mkdirSync(folder,{recursive:true});const token=randomUUID(),file=path.join(folder,token+'.sqlite');writeFileSync(file,bytes);let input;
  try{input=new DatabaseSync(file,{readOnly:true});input.exec('PRAGMA trusted_schema=OFF');fail(input.prepare('PRAGMA integrity_check').get().integrity_check==='ok','The backup is damaged');fail(input.prepare('PRAGMA foreign_key_check').all().length===0,'The backup has broken references');
   const tables=new Map(input.prepare("SELECT name,type,sql FROM sqlite_master WHERE type IN ('table','view')").all().map(t=>[t.name,t]));
   for(const name of ['business_settings','products','customers','orders','order_items','payments','stock_movements','images'])fail(tables.get(name)?.type==='table'&&!/VIRTUAL TABLE/i.test(tables.get(name).sql),'The backup is missing required records');
   for(const name of restoreTables){const table=tables.get(name);if(table)fail(table.type==='table'&&!/VIRTUAL TABLE/i.test(table.sql),'Unsupported backup table');}
   const name=input.prepare('SELECT name FROM business_settings WHERE id=1').get()?.name;fail(typeof name==='string'&&name.length>0,'The backup has no factory details');
   const counts={products:input.prepare('SELECT count(*) AS n FROM products').get().n,shops:input.prepare('SELECT count(*) AS n FROM customers').get().n,orders:input.prepare('SELECT count(*) AS n FROM orders').get().n};
   staged.set(token,{file,key,expires:Date.now()+10*60000,name});return {token,name,counts};
  }catch(e){input?.close();input=null;unlinkSync(file);throw e}finally{input?.close()}
 }
 function restoreCommit(b,key){
  const item=staged.get(b.token);fail(item&&item.key===key&&item.expires>Date.now(),'The restore preview expired. Select the backup again.');auth.verify(b.pin);fail(b.confirmName===item.name,'Enter the factory name exactly as shown');
  const recovery=snapshot('before-restore');db.prepare('ATTACH DATABASE ? AS recovery_source').run(item.file);db.exec('PRAGMA foreign_keys=OFF');
  const paymentTrigger=db.prepare("SELECT sql FROM main.sqlite_master WHERE type='trigger' AND name='payments_limit'").get()?.sql;
  try{db.exec('BEGIN IMMEDIATE');db.exec('DROP TRIGGER IF EXISTS payments_limit');for(const name of [...restoreTables].reverse())db.exec(`DELETE FROM main.${name}`);
   for(const name of restoreTables){const table=db.prepare("SELECT type,sql FROM recovery_source.sqlite_master WHERE name=?").get(name);if(!table)continue;fail(table.type==='table'&&!/VIRTUAL TABLE/i.test(table.sql),'Unsupported backup table');const columns=db.prepare(`PRAGMA main.table_info(${name})`).all().map(c=>c.name),sourceColumns=new Set(db.prepare(`PRAGMA recovery_source.table_info(${name})`).all().map(c=>c.name));const common=columns.filter(c=>sourceColumns.has(c));fail(common.length>0,'Unsupported backup table');db.exec(`INSERT INTO main.${name}(${common.map(c=>'"'+c+'"').join(',')}) SELECT ${common.map(c=>'"'+c+'"').join(',')} FROM recovery_source.${name}`)}
   db.exec("UPDATE customers SET code='SHOP-'||printf('%04d',id) WHERE code IS NULL");
   db.exec("UPDATE orders SET subtotal_cents=total_cents WHERE discount_type='none' AND subtotal_cents=0; UPDATE order_items SET net_total_cents=price_cents*quantity WHERE net_total_cents IS NULL");
   fail(db.prepare('PRAGMA main.foreign_key_check').all().length===0,'The backup has broken references');
   const s=enrich();for(const o of s.orders){fail(o.credited<=o.total&&o.netPaid>=0,'The backup contains invalid financial balances');const bill=calculateBill(o.items,o.discountType,o.discountValue);fail(cents(bill.subtotal)===cents(o.subtotal)&&cents(bill.total)===cents(o.total)&&cents(bill.discountAmount)===cents(o.discountAmount)&&o.items.every(i=>cents(i.netTotal)===cents(bill.items.find(row=>row.productId===i.productId).netTotal)),'The backup contains invalid discount totals');for(const i of o.items)fail(i.returned<=i.quantity,'The backup contains invalid return quantities')}
   if(paymentTrigger)db.exec(paymentTrigger);db.exec('DELETE FROM processed_requests');auth.audit('Database restored; current PIN retained');db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e}finally{db.exec('PRAGMA foreign_keys=ON');db.exec('DETACH DATABASE recovery_source')}
  unlinkSync(item.file);staged.delete(b.token);return {recovery:path.basename(recovery)};
 }
 const actions={'/api/archive':['Archive state changed',archive],'/api/returns':['Return recorded',returnGoods],'/api/credit-note':['Credit adjustment recorded',creditNote],'/api/refund':['Refund recorded',refund],'/api/apply-credit':['Shop credit applied',transfer],'/api/correct-order':['Order corrected',correct],'/api/order-status':['Order status changed',status],'/api/opening-entry':['Opening balance updated',openingEntry],'/api/import/commit':['Opening records imported',importCommit]};
 async function handle(req,res,url,key,body){
  if(req.method==='GET'&&url.pathname==='/api/state'){res.end(JSON.stringify({...enrich(),business:db.prepare('SELECT name,address,phone FROM business_settings WHERE id=1').get()}));return true}
  if(req.method==='GET'&&url.pathname.startsWith('/api/statement/')){res.end(JSON.stringify(statement(Number(url.pathname.split('/').pop()))));return true}
  if(req.method==='GET'&&url.pathname.startsWith('/api/order-history/')){const id=Number(url.pathname.split('/').pop());res.end(JSON.stringify(db.prepare('SELECT reason,before_json,after_json,created_at AS date FROM order_revisions WHERE order_id=? ORDER BY id DESC').all(id).map(r=>({...r,before:JSON.parse(r.before_json),after:JSON.parse(r.after_json)}))));return true}
  if(!actions[url.pathname]&&!['/api/import/preview','/api/restore/preview','/api/restore/commit'].includes(url.pathname))return false;
  fail(req.method==='POST','Unsupported request');const b=await body(req,url.pathname.startsWith('/api/restore/')?60e6:6e6);
  if(url.pathname==='/api/import/preview'){res.end(JSON.stringify(importPreview(b.kind,b.rows)));return true}
  if(url.pathname==='/api/restore/preview'){res.end(JSON.stringify(restorePreview(b,key)));return true}
  if(url.pathname==='/api/restore/commit'){const result=restoreCommit(b,key);res.end(JSON.stringify(result));return true}
  const [label,fn]=actions[url.pathname];if(url.pathname==='/api/import/commit')snapshot('before-import');else{const folder=path.join(root,'data','backups');mkdirSync(folder,{recursive:true});const target=path.join(folder,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Colombo'})+'.sqlite');if(!existsSync(target))db.prepare('VACUUM INTO ?').run(target)}transaction(label,b.requestId,()=>fn(b));res.end(JSON.stringify({...enrich(),business:db.prepare('SELECT name,address,phone FROM business_settings WHERE id=1').get()}));return true;
 }
 return {handle,enrich,transaction,snapshot,statement,importPreview,restorePreview,restoreCommit,actions};
}
