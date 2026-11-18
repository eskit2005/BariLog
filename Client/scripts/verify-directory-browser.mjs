import assert from 'node:assert/strict';
const tabs=await(await fetch('http://127.0.0.1:9335/json')).json();
const socket=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);
let sequence=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}};
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
await send('Page.enable');
await send('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:5175',storageTypes:'all'});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`
localStorage.setItem('barilog_token','fixture');
window.requests=[];
window.fetch=async(url,options={})=>{
 requests.push({url,body:options.body,method:options.method});
 let data=[];
 if(url.endsWith('/auth/me'))data={id:1,name:'Alice',role:localStorage.getItem('fixtureRole')||'RESIDENT'};
 else if(url.endsWith('/directory/buildings')||url.endsWith('/buildings'))data=[{id:10,name:'Building A'},{id:20,name:'Building B'}];
 else if(url.endsWith('/preferences'))data=options.body?JSON.parse(options.body):{sharePhone:false,shareEmail:false,shareEmergencyContacts:false};
 else if(url.endsWith('/directory'))data=[{residentId:2,name:url.includes('/20/')?'Charlie':'Bob',units:[{unitNumber:'1A',floorNumber:1}],phoneVisibility:'HIDDEN',emailVisibility:'HIDDEN'}];
 else if(url.endsWith('/emergency'))data={residentId:2,visibility:'VISIBLE',bloodGroup:'O+',emergencyContactName:'Parent',emergencyContactPhone:'01700000000'};
 return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
};`});
await send('Page.navigate',{url:'http://127.0.0.1:5175/directory'});
async function waitFor(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out: '+expression);}
await waitFor(`document.body?.innerText.includes('Bob')`);
assert.equal(await evaluate(`document.querySelectorAll('input[type=checkbox]').length`),3);
assert.equal(await evaluate(`[...document.querySelectorAll('input[type=checkbox]')].some(e=>e.checked)`),false);
await evaluate(`[...document.querySelectorAll('button')].find(e=>e.innerText==='Emergency contacts').click()`);
await waitFor(`document.body?.innerText.includes('Next-of-kin phone')`);
assert.equal(await evaluate(`document.querySelector('a[href="tel:01700000000"]')!==null`),true);
await evaluate(`document.querySelector('input[type=checkbox]').click();[...document.querySelectorAll('button')].find(e=>e.innerText==='Save privacy settings').click()`);
await waitFor(`requests.some(r=>r.method==='PUT')`);
const body=await evaluate(`JSON.parse(requests.find(r=>r.method==='PUT').body)`);
assert.deepEqual(body,{sharePhone:true,shareEmail:false,shareEmergencyContacts:false});
await evaluate(`localStorage.setItem('fixtureRole','MANAGER');location.reload()`);
await waitFor(`document.body?.innerText.includes('Building security')`);
await evaluate(`[...document.querySelectorAll('button')].find(e=>e.innerText==='Emergency contacts').click()`);
await waitFor(`document.body?.innerText.includes('Edit emergency record')`);
await evaluate(`[...document.querySelectorAll('button')].find(e=>e.innerText==='Edit emergency record').click()`);
assert.equal(await evaluate(`document.body?.innerText.includes('Save emergency record')`),true);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
assert.equal(await evaluate(`document.querySelector('.directory')!==null`),true);
console.log('Browser checks passed: route, default privacy, independent save payload, emergency phone links, manager controls, mobile render. API responses mocked; backend covered separately.');
socket.close();
