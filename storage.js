/* Lossless local-state upgrade. Legacy keys remain untouched as recovery copies. */
(function(root){
'use strict';
const KEY='herbstgrat-grand-v9', LEGACY='herbstgrat-grand-v5';
let writeLocked=false;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const number=(v,d,min=-30000000,max=30000000)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
function validate(value,defaults={}){
 if(!object(value))throw Error('Fortschritt muss ein JSON-Objekt sein.');
 const s={...defaults,...value};
 for(const k of ['tasks','stock','placed','closed']) s[k]=object(value[k])?{...value[k]}:{...(defaults[k]||{})};
 for(const [k,v] of Object.entries(s.stock))s.stock[k]=Math.max(0,Math.floor(number(v,0,0)));
 const base={x:-211,y:112,z:-389,rot:0};
 const world=object(value.sitePlace)?value.sitePlace:object(value.world)?value.world:base;
 s.world={...base,...world,x:Math.round(number(world.x,base.x)),y:Math.round(number(world.y,base.y,-2048,2048)),z:Math.round(number(world.z,base.z))};
 s.world.rot=[0,90,180,270].includes(+world.rot)?+world.rot:0;
 if(object(value.sitePlace))s.sitePlace={...s.world};
 s.level=Math.round(number(s.level,0,-19,21));s.scale=number(s.scale,18,8,40);s.hours=number(s.hours,3.5,.5,24);
 s.notes=typeof s.notes==='string'?s.notes:'';
 s.schemaVersion=9;return s;
}
function migrate(storage){
 const current=storage.getItem(KEY);if(current!==null){try{return validate(JSON.parse(current))}catch(e){writeLocked=true;return null}}
 const raw=storage.getItem(LEGACY);if(raw===null)return null;
 try{const upgraded=validate(JSON.parse(raw));upgraded.migratedFrom=LEGACY;try{storage.setItem(KEY,JSON.stringify(upgraded))}catch{}return upgraded}catch(e){return null}
}
function write(storage,state){if(writeLocked)throw Error('Beschädigte Sicherung bleibt geschützt. Bitte eine Sicherung importieren.');storage.setItem(KEY,JSON.stringify(state));}
function backup(storage,state){const extra={};for(const k of ['herbstgrat-grand-tools-v1','herbstgrat-grand-v8','herbstgrat-v8-texture-atlas']){const v=storage.getItem(k);if(v!==null)extra[k]=v}return {project:'HERBSTGRAT GRAND',schema:9,exported:new Date().toISOString(),state:validate(state),extra,...(writeLocked?{recoveryRaw:storage.getItem(KEY)}:{})};}
function restore(storage,bundle,defaults){if(bundle.project!=='HERBSTGRAT GRAND'||!object(bundle.state))throw Error('Keine Herbstgrat-Sicherung.');const state=validate(bundle.state,defaults);const allowed=['herbstgrat-grand-tools-v1','herbstgrat-grand-v8','herbstgrat-v8-texture-atlas'];const entries=allowed.filter(k=>typeof bundle.extra?.[k]==='string').map(k=>[k,bundle.extra[k]]);const undo=new Map([KEY,...entries.map(e=>e[0])].map(k=>[k,storage.getItem(k)]));try{for(const [k,v]of entries)storage.setItem(k,v);storage.setItem(KEY,JSON.stringify(state));}catch(e){for(const[k,v]of undo){try{v===null?storage.removeItem(k):storage.setItem(k,v)}catch{}}throw Error('Nicht genügend lokaler Speicher. Die Sicherung wurde nicht übernommen.')}writeLocked=false;return state;}
const api={KEY,LEGACY,validate,migrate,write,backup,restore};root.HGStorage=api;if(typeof module!=='undefined')module.exports=api;
if(typeof localStorage!=='undefined'){try{api.initial=migrate(localStorage)}catch(e){/* Private browsing remains usable in memory. */}}
})(typeof window!=='undefined'?window:globalThis);
