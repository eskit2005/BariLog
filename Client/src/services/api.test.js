import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const api=await import('./api.js');
test('refresh retry parses JSON and sends renewed token',async()=>{
 api.setAuthToken('old');let calls=0;
 globalThis.fetch=async(url,options)=>{
  calls++;
  if(calls===1)return new Response('{}',{status:401});
  if(calls===2)return new Response(JSON.stringify({accessToken:'renewed'}));
  assert.equal(options.headers.Authorization,'Bearer renewed');
  return new Response(JSON.stringify([{residentId:1}]));
 };
 assert.deepEqual(await api.getResidentDirectory(10),[{residentId:1}]);assert.equal(calls,3);
});
test('retry errors preserve status and validation messages',async()=>{
 let calls=0;
 globalThis.fetch=async()=>{calls++;return calls===1?new Response('{}',{status:401}):calls===2?new Response('{"accessToken":"new"}'):new Response('{"errors":["invalid field"]}',{status:400});};
 await assert.rejects(api.getDirectoryPreferences(),e=>e.status===400&&e.message==='invalid field');
});
test('assignment revoke handles 204',async()=>{
 globalThis.fetch=async()=>new Response(null,{status:204});
 assert.equal(await api.revokeBuildingSecurity(10,5),null);
});
test('logout while refreshing cannot restore an old session',async()=>{
 api.setAuthToken('old');let calls=0;
 globalThis.fetch=async()=>{calls++;if(calls===1)return new Response('{}',{status:401});api.setAuthToken(null);return new Response('{"accessToken":"stale"}');};
 await assert.rejects(api.getDirectoryPreferences(),e=>e.name==='AbortError');
 assert.equal(api.getAuthToken(),null);assert.equal(calls,2);
});
test('concurrent expired requests share refresh and both resolve',async()=>{
 api.setAuthToken('expired');let refreshCalls=0;
 globalThis.fetch=async(url,options={})=>{
  if(url.endsWith('/auth/refresh')){refreshCalls++;await new Promise(r=>setTimeout(r,10));return new Response('{"accessToken":"fresh"}');}
  if(options.headers.Authorization==='Bearer expired')return new Response('{}',{status:401});
  return new Response('[]');
 };
 const results=await Promise.allSettled([api.getDirectoryBuildings(),api.getDirectoryPreferences()]);
 assert.deepEqual(results.map(r=>r.status),['fulfilled','fulfilled']);
 assert.equal(refreshCalls,1);
});
