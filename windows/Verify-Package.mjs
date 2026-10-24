import {spawn} from 'node:child_process';
import {readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const app=path.resolve(process.argv[2]);
const port=process.env.VERIFY_PORT||'3096';
const origin='http://127.0.0.1:'+port;
assert.equal(readdirSync(path.join(app,'data')).length,0,'Installer must not include business records');
assert.ok(readFileSync(path.join(app,'runtime','LICENSE.txt'),'utf8').includes('Node.js'));
assert.ok(readFileSync(path.join(app,'ceylon-pure.ico')).length>1000);
const bundled=path.join(app,'runtime','node.exe');
const runtime=process.env.VERIFY_RUNTIME==='host'?process.execPath:bundled;
if(runtime!==bundled){const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');assert.equal(hash(runtime),hash(bundled),'Host runtime must exactly match the packaged runtime')}
const processHandle=spawn(runtime,['server.js'],{cwd:app,env:{...process.env,PORT:port,DB_PATH:':memory:'},windowsHide:true,stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{processHandle.stdout.once('data',resolve);processHandle.once('error',reject);processHandle.once('exit',code=>reject(Error('Packaged server exited: '+code)))});
 const status=await fetch(origin+'/api/auth/status').then(r=>r.json());
 assert.equal(status.configured,false);assert.equal(status.business.name,'Ceylon Pure Homecare');
 assert.equal((await fetch(origin+'/api/state')).status,401);
 for(const file of ['/','/app.js','/business.js','/billing.js','/i18n.js','/controls.css'])assert.equal((await fetch(origin+file)).status,200,file);
 const setup=await fetch(origin+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'839201'})});assert.equal(setup.status,200);
 const cookie=setup.headers.get('set-cookie').split(';')[0];
 const state=await fetch(origin+'/api/state',{headers:{Cookie:cookie}}).then(r=>r.json());
 assert.equal(state.products.length,0);assert.equal(state.customers.length,0);assert.equal(state.orders.length,0);
 assert.equal(readdirSync(path.join(app,'data')).length,0);
 console.log('Bundled runtime, fresh PIN setup, empty database, protected API and all application assets verified.');
}finally{processHandle.kill()}
