import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,copyFileSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const folder=mkdtempSync(path.join(tmpdir(),'ceylon-launcher-'));
const running=new Set();
const other=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({application:'ceylon-pure-homecare',instanceId:'another-installation'}))});
function install(name){const app=path.join(folder,name);mkdirSync(path.join(app,'runtime'),{recursive:true});for(const file of ['server.js','database.js','auth.js','workspace.js','operations.js','package.json'])copyFileSync(path.join(root,file),path.join(app,file));copyFileSync(path.join(root,'windows','Launch.ps1'),path.join(app,'Launch.ps1'));copyFileSync(process.execPath,path.join(app,'runtime','node.exe'));cpSync(path.join(root,'public'),path.join(app,'public'),{recursive:true});return app}
function launch(app,port){return new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(app,'Launch.ps1'),'-NoBrowser','-PreferredPort',String(port)],{windowsHide:true,stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',c=>out+=c);child.stderr.on('data',c=>err+=c);child.on('error',reject);child.on('exit',code=>code===0?resolve(out.trim()):reject(Error(err||out)));})}
async function health(url){const h=await fetch(url+'api/health').then(r=>r.json());assert.equal(h.application,'ceylon-pure-homecare');running.add(h.processId);return h}
try{
 await new Promise((resolve,reject)=>{other.once('error',reject);other.listen(43127,'127.0.0.1',resolve)});
 const first=install('First installation');let url=await launch(first,43127);assert.notEqual(new URL(url).port,'43127');const h=await health(url);
 assert.equal(h.instanceId,JSON.parse(readFileSync(path.join(first,'data','launcher.json'),'utf8').replace(/^\uFEFF/,'')).instanceId);
 const duplicate=await launch(first,43127);assert.equal(duplicate,url);assert.equal((await health(duplicate)).processId,h.processId);
 const setup=await fetch(url+'api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'839201'})});assert.equal(setup.status,200);
 const second=install('Second installation');const secondUrl=await launch(second,Number(new URL(url).port));assert.notEqual(secondUrl,url);const h2=await health(secondUrl);assert.notEqual(h2.instanceId,h.instanceId);
 assert.equal((await fetch(secondUrl+'api/auth/status').then(r=>r.json())).configured,false);
 assert.equal((await fetch(url+'api/auth/status').then(r=>r.json())).configured,true);
 process.kill(h2.processId);running.delete(h2.processId);
 // A broken application should report the actual startup failure instead of blaming a port.
 writeFileSync(path.join(second,'server.js'),"throw Error('LAUNCHER_TEST_FAILURE')");
 await assert.rejects(launch(second,Number(new URL(secondUrl).port)),/LAUNCHER_TEST_FAILURE/);
 console.log('Occupied-port fallback, installation identity, repeated launch, separate records and real startup diagnostics verified.');
}finally{
 for(const pid of running)try{process.kill(pid)}catch{}
 await new Promise(resolve=>other.close(resolve));
 // Processes have been stopped; allow Windows to release SQLite and redirected log handles.
 await new Promise(resolve=>setTimeout(resolve,300));
 rmSync(folder,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
