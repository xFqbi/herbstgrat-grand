const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const path=require('node:path');const assets=path.join(__dirname,'../assets');require(path.join(assets,'world-viewer.js'));
const I=global.HerbstgratWorld.internals,terrainContext={window:{}};vm.createContext(terrainContext);vm.runInContext(fs.readFileSync(path.join(assets,'terrain.js'),'utf8'),terrainContext);const earth=JSON.parse(JSON.stringify(terrainContext.window.HGTERRAIN));
const faces=zlib.gunzipSync(Buffer.from(earth.faceData,'base64')),vox=zlib.gunzipSync(Buffer.from(earth.voxData,'base64'));
assert.equal(faces.length,earth.countFaces*7);assert.equal(vox.length,earth.size.reduce((a,b)=>a*b,1));
assert.deepEqual(earth.anchorLocal.map((v,i)=>v+earth.offset[i]),earth.anchorWorld);
const slot=(earth.anchorLocal[1]*earth.size[2]+earth.anchorLocal[2])*earth.size[0]+earth.anchorLocal[0];assert.equal(earth.palette[vox[slot]],'minecraft:crafting_table');
let cases=0;
for(const rot of [0,90,180,270])for(const [x,y,z]of[[0,0,0],[-19,-18,-4],[53,21,39],[30,57,80]]){
 const p={x:-211,y:112,z:-389,rot},m=I.houseMatrix(p,earth.offset),pts=[];
 for(const dx of[0,1])for(const dy of[0,1])for(const dz of[0,1])pts.push([m[0]*(x+dx)+m[8]*(z+dz)+m[12],y+dy+m[13],m[2]*(x+dx)+m[10]*(z+dz)+m[14]]);
 const r=I.rotateCell(x,z,rot),expected=[p.x+r[0]-earth.offset[0],p.y+y-earth.offset[1],p.z+r[1]-earth.offset[2]];
 for(let a=0;a<3;a++){assert.equal(Math.min(...pts.map(p=>p[a])),expected[a]);assert.equal(Math.max(...pts.map(p=>p[a])),expected[a]+1);}cases++;
}
const geo=I.terrainGeometry(earth,faces);assert.equal((geo.opaque.length+geo.water.length)/60,earth.countFaces);
for(const data of [geo.opaque,geo.water])for(let i=0;i<data.length;i+=10)for(let a=0;a<3;a++){assert.ok(Number.isFinite(data[i+a]));assert.ok(data[i+a]>=0&&data[i+a]<=earth.size[a]);}
for(let f=0;f<6;f++){
 const data=I.terrainGeometry({palette:['minecraft:stone'],solidCategories:[1]},Uint8Array.from([2,3,4,5,7,f,1])).opaque;
 const range=a=>Math.max(...Array.from({length:6},(_,i)=>data[i*10+a]))-Math.min(...Array.from({length:6},(_,i)=>data[i*10+a]));
 assert.equal(range(0),f<2?0:7);assert.equal(range(1),f===2||f===3?0:5);assert.equal(range(2),f<2?7:f===2||f===3?5:0);
 assert.equal(range(3),7);assert.equal(range(4),5);
 if(f!==2&&f!==3){for(let i=0;i<6;i++)assert.equal(data[i*10+4],1-(data[i*10+1]-3));}
}
const opts={houseCut:Infinity,group:'all'},items={wall:{kind:'wood'},leavesO:{kind:'nature'}};
const blocks=[{id:0,x:0,y:0,z:0,type:'wall',stage:'wall'},{id:1,x:1,y:0,z:0,type:'wall',stage:'wall'}];
assert.equal(I.houseGeometry(blocks,items,opts,()=>false).opaque.length/60,10);
const cut=I.houseGeometry([{...blocks[0]},{...blocks[1],x:0,y:1}],items,{...opts,houseCut:0},()=>false);assert.equal(cut.count,1);assert.equal(cut.opaque.length/60,6);
assert.equal(I.houseGeometry(blocks,items,{...opts,hideBuilt:true},id=>id===0).count,1);
assert.equal(I.houseGeometry(blocks,items,{...opts,group:'keller'},()=>false).count,0);
const stair=I.blockBoxes({id:4,x:0,y:0,z:0,type:'roof',properties:{facing:'east',half:'top'}},new Map());assert.equal(stair.inferred,false);assert.deepEqual(stair.boxes[0],[0,.5,0,1,.5,1]);assert.deepEqual(stair.boxes[1],[.5,0,0,.5,.5,1]);
assert.equal(I.blockBoxes({x:0,y:0,z:0,type:'roof'},new Map()).inferred,true);
const green=I.previewPixels('minecraft:oak_leaves');assert.ok([...green].filter((v,i)=>i%4===3&&v===0).length>0);
const source=fs.readFileSync(path.join(assets,'project.js'),'utf8'),context={window:{}};vm.createContext(context);vm.runInContext(source+';globalThis.testProject=PROJECT;',context);const project=context.testProject;
const full=project.blocks.map((b,id)=>({x:b[0],y:b[1],z:b[2],type:b[3],stage:b[4],id}));const t=performance.now(),house=I.houseGeometry(full,project.items,opts,()=>false);assert.equal(house.count,full.length);
console.log(JSON.stringify({passed:true,rotationCases:cases,anchor:earth.anchorWorld,terrainFaces:earth.countFaces,houseBlocks:house.count,houseFaces:(house.opaque.length+house.transparent.length)/60,inferredShapes:house.inferred,houseBuildMs:Math.round(performance.now()-t),textures:HerbstgratWorld.textureReport()}));


// ZIP/JAR parser regressions. Browser PNG decode and storage are replaced with narrow
// fakes; the parser consumes real ZIP headers and real stored/deflated PNG bytes.
async function zipTests(){
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const calls=[],decoded=[]; const fakeContext={clearRect(){},drawImage(...a){calls.push(a.slice(1));},getImageData(){return {data:new Uint8ClampedArray(4096).fill(200)};}};global.document={createElement(){return {width:0,height:0,getContext(){return fakeContext;}};}};
 global.createImageBitmap=async blob=>{decoded.push(Buffer.from(await blob.arrayBuffer()));return{width:64,height:128,close(){}};};
 const nativeDecompressionStream=global.DecompressionStream;
 global.DecompressionStream=class{constructor(format){assert.equal(format,'deflate-raw');const chunks=[];return new TransformStream({transform(chunk){chunks.push(Buffer.from(chunk));},flush(c){c.enqueue(zlib.inflateRawSync(Buffer.concat(chunks)));}});}};
 function zip(entries){const locals=[],central=[];let offset=0;for(const e of entries){const name=Buffer.from(e.name),raw=e.bytes||png,data=e.method===8?zlib.deflateRawSync(raw):raw,h=Buffer.alloc(30),c=Buffer.alloc(46);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(e.method||0,8);h.writeUInt32LE(data.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(name.length,26);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(e.method||0,10);c.writeUInt32LE(data.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);locals.push(h,name,data);central.push(c,name);offset+=h.length+name.length+data.length;}const dir=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,dir,end]);}
 const file=b=>({size:b.length,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)});
 I.terrainGeometry({palette:['promenade:stone'],solidCategories:[1]},[0,0,0,1,1,2,1]);
 I.houseGeometry([{id:400,x:0,y:0,z:0,type:'chest',stage:'innen_eg'},{id:401,x:1,y:0,z:0,type:'v8ender',stage:'keller_lager'}],{},opts,()=>false);
 const archive=zip([{name:'assets/minecraft/textures/block/stone.png'},{name:'assets/promenade/textures/block/stone.png',method:8},{name:'assets/minecraft/textures/entity/chest/normal.png'},{name:'assets/minecraft/textures/entity/chest/ender.png'},{name:'assets/minecraft/textures/block/unused.png'}]);
 const result=await HerbstgratWorld.importTextures(file(archive));assert.equal(result.loaded,4);assert.equal(result.original,4);assert.equal(result.persisted,false);assert.equal(decoded.length,4);for(const p of decoded)assert.deepEqual(p,png);
 assert.deepEqual(calls[0],[0,0,64,64,0,0,32,32]); // first square frame, not whole animation strip
 assert.deepEqual(calls[2],[14,14,14,5,0,0,32,11]);assert.deepEqual(calls[3],[14,33,14,10,0,11,32,21]);
 await assert.rejects(()=>HerbstgratWorld.importTextures(file(Buffer.from('no zip'))),/ZIP/);
 await assert.rejects(()=>HerbstgratWorld.importTextures({size:513*1024*1024}),/512/);
 await assert.rejects(()=>HerbstgratWorld.importTextures(file(zip([{name:'notes/readme.txt'}]))),/Keine passenden/);
 const broken=Buffer.from(archive);broken.writeUInt32LE(0xffffff00,broken.length-6);await assert.rejects(()=>HerbstgratWorld.importTextures(file(broken)),/Inhaltsverzeichnis/);
 const reset=await HerbstgratWorld.resetTextures();assert.equal(reset.original,0);assert.equal(reset.preview,reset.needed);
 global.DecompressionStream=nativeDecompressionStream;
 console.log(JSON.stringify({zipTestsPassed:true,storedAndDeflated:true,namespaceIsolation:true,entityChestAtlases:true,firstAnimationFrame:true,malformedArchivesRejected:true}));
}



function lifecycleTest(){
 let visible=false,contexts=0,scheduled=0,callback=null,painted=0;
 const ctx={fillRect(){painted++;},fillText(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){}};
 const events=new Map(),canvas={clientWidth:640,clientHeight:480,width:0,height:0,style:{},getContext(kind){contexts++;return kind==='2d'?ctx:null;},addEventListener(k,fn){events.set(k,fn);},removeEventListener(k){events.delete(k);}};ctx.canvas=canvas;
 global.requestAnimationFrame=fn=>{scheduled++;callback=fn;return scheduled;};global.cancelAnimationFrame=()=>{};
 const viewer=HerbstgratWorld.create({canvas,isVisible:()=>visible,blocks:[],items:{}});
 assert.equal(contexts,0);for(let i=0;i<20;i++)viewer.request();assert.equal(scheduled,1);callback();assert.equal(contexts,0);assert.equal(scheduled,1);
 visible=true;viewer.request();callback();assert.equal(contexts,2);assert.equal(painted,1);assert.equal(scheduled,2);assert.equal(viewer.getStats().mode,'fallback');
 viewer.setPlacement({x:-210,y:110,z:-354,rot:90});viewer.setOptions({houseCut:4});viewer.updateHits([[1,2,3]]);assert.equal(scheduled,3);callback();assert.equal(scheduled,3);
 viewer.dispose();assert.equal(events.size,0);viewer.request();assert.equal(scheduled,3);
 console.log(JSON.stringify({lifecycleTestsPassed:true,lazyContext:true,coalescedRequests:true,idleNoFrames:true,fallback:true,disposeRemovesListeners:true}));
}
zipTests().then(lifecycleTest).catch(e=>{console.error(e);process.exitCode=1;});
