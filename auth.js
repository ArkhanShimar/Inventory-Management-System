import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export function createAuth(db) {
  const hashToken = token => createHash('sha256').update(token).digest('hex');
  const credential = () => db.prepare('SELECT * FROM credentials WHERE id=1').get();
  const audit = action => db.prepare('INSERT INTO audit_log(action,created_at) VALUES(?,?)').run(action,new Date().toISOString());
  const fail = (message,status=400) => {const error=Error(message);error.status=status;throw error};
  const validate = pin => {if(typeof pin!=='string'||!/^\d{6,12}$/.test(pin))fail('Use a PIN with 6 to 12 digits.');};
  function verify(pin) {
    const c=credential();if(!c)fail('Set up your workspace PIN first.',401);
    if(c.locked_until>Date.now())fail('Too many attempts. Please wait 5 minutes before trying again.',429);
    const candidate=scryptSync(typeof pin==='string'?pin.slice(0,128):'',c.salt,64);
    if(!timingSafeEqual(candidate,Buffer.from(c.pin_hash,'hex'))){
      const attempts=c.failed_attempts+1;
      db.prepare('UPDATE credentials SET failed_attempts=?,locked_until=? WHERE id=1').run(attempts>=5?0:attempts,attempts>=5?Date.now()+300000:0);
      audit('Unsuccessful PIN attempt');fail(attempts>=5?'Too many attempts. Please wait 5 minutes before trying again.':'Incorrect PIN. Please try again.',attempts>=5?429:401);
    }
    db.prepare('UPDATE credentials SET failed_attempts=0,locked_until=0 WHERE id=1').run();
  }
  function setPin(pin){validate(pin);const salt=randomBytes(32).toString('hex');db.prepare('INSERT INTO credentials(id,salt,pin_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET salt=excluded.salt,pin_hash=excluded.pin_hash,failed_attempts=0,locked_until=0').run(salt,scryptSync(pin,salt,64).toString('hex'));}
  function issue(res){const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at < ? OR last_seen < ?').run(Date.now(),Date.now()-30*60000);db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token),Date.now()+8*3600000,Date.now());res.setHeader('Set-Cookie',`luma_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);}
  function session(req){const token=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('luma_session='))?.slice(13);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const key=hashToken(token);const row=db.prepare('SELECT * FROM sessions WHERE token_hash=?').get(key);if(!row||row.expires_at<Date.now()||row.last_seen<Date.now()-30*60000){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(key);return null}db.prepare('UPDATE sessions SET last_seen=? WHERE token_hash=?').run(Date.now(),key);return key;}
  return {
    configured:()=>!!credential(),session,audit,verify,
    setup(pin,res){if(credential())fail('A PIN is already configured.',409);setPin(pin);audit('Workspace PIN created');issue(res)},
    login(pin,res){verify(pin);issue(res);audit('Administrator signed in')},
    change(currentPin,newPin,res){validate(newPin);verify(currentPin);setPin(newPin);db.prepare('DELETE FROM sessions').run();issue(res);audit('Workspace PIN changed; previous sessions revoked')},
    logout(key,res){if(key)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(key);res.setHeader('Set-Cookie','luma_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');}
  };
}
