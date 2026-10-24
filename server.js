import http from 'node:http';
import { openStore } from './database.js';
import { createWorkspace } from './workspace.js';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {calculateBill} from './public/billing.js';
const root=path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(root,'data'),{recursive:true});
const store=openStore(process.env.DB_PATH||path.join(root,'data','inventory.sqlite'));
const workspace=createWorkspace(store,root);
function state(){return {...workspace.operations.enrich(),business:workspace.business()}}
function save(s,action,requestId){if(!process.env.DB_PATH){const folder=path.join(root,'data','backups');mkdirSync(folder,{recursive:true});const target=path.join(folder,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Colombo'})+'.sqlite');if(!existsSync(target))store.db.prepare('VACUUM INTO ?').run(target)}workspace.operations.transaction(action,requestId,()=>store.write(s,{transaction:false}))}
function assert(ok,message){if(!ok)throw Error(message)}
function number(n){return typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e10&&Math.abs(n*100-Math.round(n*100))<0.0001}
const nextId=items=>items.reduce((max,item)=>Math.max(max,item.id),0)+1;
const server=http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://localhost');
if(url.pathname.startsWith('/api/')){
if(req.headers.origin)assert(['http://localhost:'+(process.env.PORT||3000),'http://127.0.0.1:'+(process.env.PORT||3000)].includes(req.headers.origin),'Request origin is not allowed');
res.setHeader('Content-Type','application/json');
if(await workspace.handle(req,res,url))return;
if(req.method==='GET'&&url.pathname==='/api/state')return res.end(JSON.stringify(state()));
if(req.method==='GET'&&url.pathname==='/api/database-status'){const check=store.db.prepare('PRAGMA quick_check').get();return res.end(JSON.stringify({engine:'SQLite',connected:check.quick_check==='ok',schemaVersion:5,tables:['products','customers','orders','order_items','payments','stock_movements']}))}
assert(req.method==='POST','Unsupported request');let raw='';for await(const chunk of req){raw+=chunk;assert(raw.length<2e6,'Request too large')}const b=JSON.parse(raw);const action=({products:'Product saved',stock:'Stock adjusted',customers:'Shop saved',orders:'Order placed',payment:'Payment received','order-status':'Order status changed'})[url.pathname.split('/').pop()]||'Workspace updated';if(b.requestId&&store.db.prepare('SELECT request_key FROM processed_requests WHERE request_key=?').get(action+':'+b.requestId))return res.end(JSON.stringify(state()));const s=state();
if(url.pathname==='/api/products'){assert(b.name?.trim()&&b.variant?.trim()&&b.category,'Product name, variant and category are required');assert(number(b.price)&&b.price>=0&&Number.isSafeInteger(b.stock)&&b.stock>=0&&b.stock<=1000000000&&Number.isSafeInteger(b.minimum)&&b.minimum>=0&&b.minimum<=1000000000,'Enter valid prices and whole stock quantities');if(b.imageId)assert(typeof b.imageId==='string'&&store.db.prepare('SELECT id FROM images WHERE id=?').get(b.imageId),'Upload a valid product image');if(b.id){const p=s.products.find(p=>p.id===b.id);assert(p,'Product not found');if(b.imageId!==undefined)p.imageId=b.imageId||null;Object.assign(p,{name:b.name.trim(),variant:b.variant.trim(),size:b.size,category:b.category,price:b.price,minimum:b.minimum})}else{const id=nextId(s.products);s.products.push({...b,imageId:b.imageId||null,id,sku:`LM-${String(id).padStart(4,'0')}`});if(b.stock)s.movements.unshift({id:nextId(s.movements),product:b.name+' · '+b.variant,quantity:b.stock,reason:'Opening stock',date:new Date().toISOString()})}}
else if(url.pathname==='/api/stock'){const p=s.products.find(p=>p.id===b.id);assert(p,'Product not found');assert(Number.isSafeInteger(b.quantity)&&b.quantity!==0&&p.stock+b.quantity>=0&&p.stock+b.quantity<=1000000000,'Enter a valid quantity; stock cannot be negative');assert(b.reason?.trim(),'A reason is required');p.stock+=b.quantity;s.movements.unshift({id:nextId(s.movements),product:p.name+' · '+p.variant,quantity:b.quantity,reason:b.reason,date:new Date().toISOString()})}
else if(url.pathname==='/api/customers'){assert(b.name?.trim(),'Shop name is required');const values={name:b.name.trim(),area:b.area||'',phone:b.phone||''};if(b.id){const c=s.customers.find(c=>c.id===b.id);assert(c,'Shop not found');Object.assign(c,values)}else s.customers.push({id:nextId(s.customers),...values})}
else if(url.pathname==='/api/orders'){
 const saleType=b.saleType??'shop',retail=saleType==='retail';
 assert(['shop','retail'].includes(saleType),'Choose a valid sale type');
 if(!retail)assert(s.customers.some(c=>c.id===b.customerId&&!c.archived),'Choose a shop');
 else assert(b.customerId==null,'Retail sales cannot use a shop account');
 assert((b.customerName===undefined||typeof b.customerName==='string'&&b.customerName.length<=150)&&(b.customerPhone===undefined||typeof b.customerPhone==='string'&&b.customerPhone.length<=50),'Enter valid customer details');
 assert(Array.isArray(b.items)&&b.items.length&&b.items.length<=100,'Add at least one product');
 const grouped=new Map();
 for(const item of b.items){assert(Number.isSafeInteger(item.quantity)&&item.quantity>0,'Enter a valid quantity');grouped.set(item.productId,(grouped.get(item.productId)||0)+item.quantity)}
 const items=[...grouped].map(([id,quantity])=>{const p=s.products.find(p=>p.id===id);assert(p&&!p.archived&&Number.isSafeInteger(quantity)&&p.stock>=quantity,'Insufficient stock');return{productId:id,name:p.name,variant:p.variant,size:p.size,quantity,price:p.price}});
 const bill=calculateBill(items,b.discountType??'none',b.discountValue??0),total=bill.total;
 assert(number(total)&&number(b.paid)&&b.paid>=0&&b.paid<=total,'Payment must be between zero and the order total');
 if(retail)assert(Math.round(b.paid*100)===Math.round(total*100),'Walk-in sales must be fully paid');
 const id=nextId(s.orders),reference=`LM-${String(id).padStart(4,'0')}`,date=new Date().toISOString();
 for(const i of items){s.products.find(p=>p.id===i.productId).stock-=i.quantity;s.movements.unshift({id:nextId(s.movements),product:i.name+' · '+i.variant,quantity:-i.quantity,reason:'Order '+reference,date})}
 s.orders.unshift({id,reference,customerId:retail?null:b.customerId,saleType,customerName:retail?(b.customerName||'').trim():'',customerPhone:retail?(b.customerPhone||'').trim():'',...bill,paid:b.paid,status:retail?'Delivered':'Placed',date,notes:b.notes||''});
}
else if(url.pathname==='/api/payment'){const o=s.orders.find(o=>o.id===b.id);assert(o&&o.status!=='Cancelled','Order not available');assert(number(b.amount)&&b.amount>0&&Math.round(b.amount*100)<=Math.round(o.due*100),'Enter a payment within the outstanding balance');o.paid=Math.round((o.paid+b.amount)*100)/100}
else if(url.pathname==='/api/order-status'){const o=s.orders.find(o=>o.id===b.id);assert(o&&o.status==='Placed','Only placed orders can be updated');assert(['Delivered','Cancelled'].includes(b.status),'Invalid status');if(b.status==='Cancelled'){assert(o.paid===0,'Only unpaid orders can be cancelled. Resolve any collected payment first.');assert(o.status!=='Delivered','Delivered orders cannot be cancelled');for(const i of o.items){s.products.find(p=>p.id===i.productId).stock+=i.quantity;s.movements.unshift({id:nextId(s.movements),product:i.name+' · '+i.variant,quantity:i.quantity,reason:'Cancelled '+o.reference,date:new Date().toISOString()})}}o.status=b.status}
else throw Error('Unknown action');save(s,action,b.requestId);return res.end(JSON.stringify(state()));
}
const files={'/billing.js':'billing.js','/':'index.html','/app.js':'app.js','/styles.css':'styles.css','/refinements.css':'refinements.css','/controls.css':'controls.css','/i18n.js':'i18n.js','/dropdowns.js':'dropdowns.js','/business.js':'business.js','/csv.js':'csv.js','/i18n-business.js':'i18n-business.js'};assert(files[url.pathname],'Not found');res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');res.end(readFileSync(path.join(root,'public',files[url.pathname])));
}catch(e){res.statusCode=e.status||400;res.end(JSON.stringify({error:e.message}))}});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('Luma is ready at http://localhost:'+(process.env.PORT||3000)));







