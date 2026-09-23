import {describe,expect,it} from 'vitest';
import {localTestCspSources} from '../../scripts/local-test-csp.mjs';
describe('local verification CSP',()=>{
  it('allows only the selected loopback backend and its websocket',()=>{
    expect(localTestCspSources('http://127.0.0.1:56321','http://127.0.0.1:56321')).toEqual(['http://127.0.0.1:56321','ws://127.0.0.1:56321']);
  });
  it.each(['https://example.com','http://localhost.evil.test','http://user:password@localhost','http://localhost/path',"http://localhost/#;script-src *",'bad-url'])('rejects %s',url=>{
    expect(localTestCspSources(url,url)).toEqual([]);
  });
  it('does not change hosted or unconfirmed configurations',()=>{
    expect(localTestCspSources('http://localhost:56321',undefined)).toEqual([]);
    expect(localTestCspSources('http://localhost:56321','http://localhost:56321',true)).toEqual([]);
  });
});
