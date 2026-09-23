import {describe,expect,it} from 'vitest';
import {isDatabaseRequest} from './database-network-only';
describe('database cache isolation across deployment targets',()=>{
  it.each(['rest/v1/profiles','auth/v1/user','functions/v1/private','realtime/v1'])('never caches %s on local, custom or Supabase origins',path=>{
    for(const base of ['http://127.0.0.1:56321','https://db.example.test','https://example.supabase.co']){
      expect(isDatabaseRequest(new URL(`${base}/${path}`),base+'/')).toBe(true);
    }
  });
  it('does not confuse an unrelated host or public storage with database traffic',()=>{
    expect(isDatabaseRequest(new URL('https://other.test/rest/v1/a'),'https://db.test')).toBe(false);
    expect(isDatabaseRequest(new URL('https://example.supabase.co/storage/v1/object/public/avatar'))).toBe(false);
    expect(isDatabaseRequest(new URL('https://supabase.co.example.test/rest/v1/a'))).toBe(false);
  });
});
