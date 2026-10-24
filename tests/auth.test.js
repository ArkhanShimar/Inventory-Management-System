import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../database.js';
import {createAuth} from '../auth.js';

test('PIN hashes, lockout and session expiry are enforced',()=>{
 const store=openStore(':memory:');const auth=createAuth(store.db);let cookie='';const res={setHeader(name,value){if(name==='Set-Cookie')cookie=value.split(';')[0]}};
 try{
  assert.throws(()=>auth.setup('123',res),/6 to 12/);
  auth.setup('839201',res);const row=store.db.prepare('SELECT * FROM credentials').get();assert.notEqual(row.pin_hash,'839201');assert.equal(row.pin_hash.length,128);
  const req={headers:{cookie}};assert.ok(auth.session(req));
  const storedToken=store.db.prepare('SELECT token_hash FROM sessions').get().token_hash;assert.notEqual(storedToken,cookie.split('=')[1]);
  for(let i=0;i<4;i++)assert.throws(()=>auth.login('000000',res),/Incorrect/);
  assert.throws(()=>auth.login('000000',res),/Too many/);assert.throws(()=>auth.login('839201',res),/Too many/);
  store.db.prepare('UPDATE credentials SET locked_until=0').run();auth.login('839201',res);
  store.db.prepare('UPDATE sessions SET last_seen=?').run(Date.now()-31*60000);assert.equal(auth.session({headers:{cookie}}),null);
 }finally{store.close()}
});

test('changing PIN revokes other sessions and requires the current PIN',()=>{
 const store=openStore(':memory:');const auth=createAuth(store.db);let cookie='';const res={setHeader(name,value){if(name==='Set-Cookie')cookie=value.split(';')[0]}};
 try{auth.setup('839201',res);const previous=cookie;assert.throws(()=>auth.change('000000','728190',res),/Incorrect/);auth.change('839201','728190',res);assert.equal(auth.session({headers:{cookie:previous}}),null);assert.ok(auth.session({headers:{cookie}}));assert.throws(()=>auth.login('839201',res),/Incorrect/);auth.login('728190',res)}finally{store.close()}
});
