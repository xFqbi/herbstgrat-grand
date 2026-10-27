(()=>{
'use strict';
const $v=s=>document.querySelector(s), model=PROJECT, earth=window.HGTERRAIN;
const dims=earth.size, dx=dims[0],dy=dims[1],dz=dims[2], offset=earth.offset;const originDefault={x:-211,y:112,z:-389,rot:0};
const isSite=()=>document.getElementById('view-site').classList.contains('active');
let voxel=null, faces=null, topHeight=null, topType=null, mapImage=null, siteGL=null;
let previouslyCalibrated=state.world&&Number(state.world.x)>=-240&&Number(state.world.x)<=-121&&Number(state.world.z)>=-434&&Number(state.world.z)<=-319?state.world:null;
let placed={...originDefault,...(state.sitePlace||state.world||{})};
let collisionInfo=null, needsRender=true, selectedLocal={x:0,y:0,z:0};
const sl=$v('#siteOriginX'),sy=$v('#siteOriginY'),sz=$v('#siteOriginZ'),sr=$v('#siteRotation');
function palColor(n){n=String(n).toLowerCase();if(n.includes('water')||n.includes('bubble_column'))return [48,132,183];if(n.includes('grass_block'))return [112,146,82];if(n.includes('dirt')||n.includes('mud'))return [120,93,69];if(n.includes('gravel'))return [124,124,118];if(n.includes('sandstone'))return [201,187,141];if(n.includes('sand'))return [211,199,154];if(n.includes('blunite'))return [89,108,151];if(n.includes('asphalt'))return [86,94,93];if(n.includes('coal'))return [72,78,76];if(n.includes('copper'))return [139,104,79];if(n.includes('iron_ore'))return [141,125,114];if(n.includes('stone')||n.includes('ore')||n.includes('cobble'))return [129,135,132];if(n.includes('crafting_table'))return [219,150,65];if(n.includes('wood')||n.includes('chest')||n.includes('oak'))return [133,101,61];if(n.includes('leaf')||n.includes('leaves'))return [115,146,74];return [113,133,115]}
const colors=earth.palette.map(palColor);
function rgbaHex(hex){let s=hex.replace('#','');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));}
function XYZ(x,y,z){return (y*dz+z)*dx+x}
function volumeAt(x,y,z){return x>=0&&x<dx&&y>=0&&y<dy&&z>=0&&z<dz ? earth.solidCategories[voxel[XYZ(x,y,z)]] : -1;}
function decodeBase64(s){let binary=atob(s),out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;}
async function unzip(s){const zipped=decodeBase64(s);if(typeof DecompressionStream==='undefined')throw Error('Dein Browser unterstützt die lokale GZIP-Entpackung nicht. Bitte Chrome oder einen aktuellen Safari verwenden.');let result=await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();return new Uint8Array(result)}
function rotate(x,z,r){if(r===90)return [z,-x];if(r===180)return [-x,-z];if(r===270)return [-z,x];return [x,z]}
function toTerrain(b){let q=rotate(b.x,b.z,placed.rot);return {x:placed.x+q[0]-offset[0],y:placed.y+b.y-offset[1],z:placed.z+q[1]-offset[2]}}
function toActual(b){let q=rotate(b.x,b.z,placed.rot);return {x:placed.x+q[0],y:placed.y+b.y,z:placed.z+q[1]}}
function savePlace(){state.sitePlace={...placed};state.world={...placed};save()}
function syncInputs(){sl.value=placed.x;sy.value=placed.y;sz.value=placed.z;sr.value=placed.rot;[$v('#worldX'),$v('#worldY'),$v('#worldZ'),$v('#worldRot')].forEach((e,i)=>{if(e)e.value=[placed.x,placed.y,placed.z,placed.rot][i]});coordinate()}
function setPlace(p,report=true){placed.x=Math.round(Number(p.x));placed.y=Math.round(Number(p.y));placed.z=Math.round(Number(p.z));placed.rot=((Number(p.rot)%360)+360)%360;if(![0,90,180,270].includes(placed.rot))placed.rot=0;savePlace();syncInputs();if(voxel){collision();drawMap();siteGL?.setPlacement?.(placed);requestRender();}document.dispatchEvent(new CustomEvent('hg:placement',{detail:{...placed}}));if(report)status('Hausposition gespeichert · '+placed.x+' / '+placed.y+' / '+placed.z)}
function status(t){$v('#siteFPS').textContent=t}
function collision(){let hits=0,waters=0,unknown=0,unknownAbove=0,unknownSide=0,plannedDig=0;const cols=new Map(),collisionPoints=[],cliffColumns=[];
for(const b of blocks){const t=toTerrain(b),val=volumeAt(t.x,t.y,t.z);if(val===1){if(b.stage.startsWith('keller_'))plannedDig++;else{hits++;if(collisionPoints.length<4500)collisionPoints.push([t.x+.5,t.y+.5,t.z+.5])}}else if(val===2)waters++;else if(val<0){unknown++;if(t.y>=dy)unknownAbove++;else unknownSide++}if(b.stage.startsWith('keller_'))continue;const key=t.x+','+t.z;let c=cols.get(key);if(!c||t.y<c.y)cols.set(key,{x:t.x,y:t.y,z:t.z})}
let gapCount=0,grounded=0,unknownColumns=0;const footprint=new Map();for(const col of cols.values()){let v=volumeAt(col.x,col.y-1,col.z),found=v===1;let distance=0;if(v===-1){unknownColumns++;}else{if(!found){for(let k=2;k<=18;k++){let n=volumeAt(col.x,col.y-k,col.z);if(n===1){found=true;distance=k-1;break}if(n===-1){unknownColumns++;break}}}if(found){if(distance>=3)gapCount++;else grounded++}else if(v!==-1)gapCount++}footprint.set(col.x+','+col.z,{x:col.x,z:col.z,y:col.y,collision:volumeAt(col.x,col.y,col.z)===1,grounded:found,deep:distance})}
collisionInfo={hits,waters,unknown,unknownAbove,unknownSide,gapCount,grounded,unknownColumns,footprint,collisionPoints};let total=blocks.length;
$v('#siteCollisionStats').innerHTML=[['Bauplan-Positionen',total.toLocaleString('de-DE')],['In bestehendem Gelände (Haus)',hits.toLocaleString('de-DE')+' rot'],['Geplanter Keller-Aushub (statt Baufehler)',plannedDig.toLocaleString('de-DE')],['In Wasser',waters.toLocaleString('de-DE')],['Außerhalb Export (darüber)',unknownAbove.toLocaleString('de-DE')],['Außerhalb Export (seitlich/unten)',unknownSide.toLocaleString('de-DE')],['Spalten mit tiefem Fundamentbedarf',gapCount.toLocaleString('de-DE')],['Nicht sicher überprüfbare Säulen',unknownColumns.toLocaleString('de-DE')]].map(([k,v])=>'<div class="siteKPI"><span>'+k+'</span><b>'+v+'</b></div>').join('');
$v('#siteCollisionNote').textContent='Achtung: Die Geländeauswahl endet bei Welt-Y 119. Hausblöcke oberhalb davon erscheinen bei „außerhalb Export (darüber)“ und sind nicht automatisch Kollisionen. Im Fels gelegene Kellerblöcke werden gesondert als geplante Ausschachtung gezählt. Treppen/Stufen werden als volle Würfel gerechnet; Stützen nur heuristisch. Für vollständig geprüfte Dachhöhen müsste der Geländeexport nach oben erweitert werden.';
if(siteGL)siteGL.updateHits(collisionPoints)
}
function coordinate(){const bx=Number($v('#siteLocalX').value)||0,by=Number($v('#siteLocalY').value)||0,bz=Number($v('#siteLocalZ').value)||0;selectedLocal={x:bx,y:by,z:bz};let b=toActual(selectedLocal);$v('#siteBlockWorld').textContent=b.x+' / '+b.y+' / '+b.z}
['siteLocalX','siteLocalY','siteLocalZ'].forEach(id=>$v('#'+id).addEventListener('input',coordinate));
$v('#siteCopyBlock').onclick=async()=>{let b=toActual(selectedLocal),s=b.x+' '+b.y+' '+b.z;try{await navigator.clipboard.writeText(s);toast('Zielkoordinaten kopiert: '+s)}catch(e){toast('Zielkoordinaten: '+s)}};
$v('#siteTakeLayer').onclick=()=>{$v('#siteLocalY').value=state.level;coordinate()};
[sl,sy,sz,sr].forEach(e=>e.addEventListener('change',()=>setPlace({x:sl.value,y:sy.value,z:sz.value,rot:sr.value})));
document.querySelectorAll('[data-site-shift]').forEach(b=>b.addEventListener('click',()=>{let [x,z]=b.dataset.siteShift.split(',').map(Number);setPlace({...placed,x:placed.x+x,z:placed.z+z},false)}));
$v('#siteUp').onclick=()=>setPlace({...placed,y:placed.y+1},false);$v('#siteDown').onclick=()=>setPlace({...placed,y:placed.y-1},false);
$v('#siteReset').onclick=()=>{if(confirm('Haus zur vorgeschlagenen Startposition zurücksetzen?'))setPlace(originDefault)};
$v('#siteSyncGuide').onclick=()=>{savePlace();$v('#hb-launch')?.click();if(!document.querySelector('#hb-overlay.open')){nav('layers');toast('Standort synchronisiert – geführten Baumodus öffnen')}};
$v('#siteShowHouse').addEventListener('change',requestRender);$v('#siteShowTerrain').addEventListener('change',requestRender);$v('#siteShowWater').addEventListener('change',requestRender);$v('#siteShowHits').addEventListener('change',requestRender);
$v('#siteAlpha').oninput=e=>{$v('#siteAlphaText').textContent=e.target.value+' %';requestRender()};$v('#siteCut').oninput=e=>{$v('#siteCutText').textContent='Y ≤ '+e.target.value;requestRender()};
function downloadText(name,text,mime){const blob=new Blob([text],{type:mime||'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),6000)}
$v('#siteExportCoords').onclick=()=>{let lines=['Block-ID;Abschnitt;Material;Welt-X;Welt-Y;Welt-Z;Status;Gelände'];for(const b of blocks){let t=toTerrain(b),w=toActual(b),c=voxel?volumeAt(t.x,t.y,t.z):-1;lines.push([b.id,b.stage,PROJECT.items[b.type].name,w.x,w.y,w.z,state.placed[b.id]?'Gebaut':'Offen',c===1?'Kollision':c===2?'Wasser':c<0?'Außerhalb Export':'Frei'].join(';'))}downloadText('Herbstgrat_Weltkoordinaten_'+placed.x+'_'+placed.z+'.csv','\ufeff'+lines.join('\n'),'text/csv;charset=utf-8');toast('Baukoordinaten als CSV exportiert')};
$v('#siteExportMap').onclick=()=>{if(!mapImage)return;const canvas=$v('#siteMap');canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Herbstgrat_Echter_Berg_Lageplan.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)},'image/png')};
function buildTop(){topHeight=new Int16Array(dx*dz);topType=new Uint8Array(dx*dz);let pix=new Uint8ClampedArray(dx*dz*4);for(let z=0;z<dz;z++)for(let x=0;x<dx;x++){let solid=-1,water=-1,topIndex=0;for(let y=dy-1;y>=0;y--){const pi=voxel[XYZ(x,y,z)];const cat=earth.solidCategories[pi];if(cat===1&&solid<0){solid=y;topIndex=pi}if(cat===2&&water<0)water=y;}let idx=z*dx+x;topHeight[idx]=solid;let waterShown=water>solid;topType[idx]=waterShown?255:topIndex;let c=waterShown?[40,125,173]:solid<0?[19,37,31]:colors[topIndex].slice();const dark=solid<0?1:Math.max(.55,Math.min(1.25,.7+solid/135));let shade=((x*31+z*17)%11-5)*.9;for(let t=0;t<3;t++)pix[4*idx+t]=Math.min(255,Math.max(0,c[t]*dark+shade));pix[4*idx+3]=255;}const c=document.createElement('canvas');c.width=dx;c.height=dz;c.getContext('2d').putImageData(new ImageData(pix,dx,dz),0,0);mapImage=c;}
function drawMap(){if(!mapImage)return;const canvas=$v('#siteMap');const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;ctx.drawImage(mapImage,0,0,w,h);const scalex=w/dx,scalez=h/dz;const hit=collisionInfo;
if(hit){for(const p of hit.footprint.values()){if(p.x<0||p.x>=dx||p.z<0||p.z>=dz)continue;ctx.fillStyle=p.collision?'#ff4e52a0':p.grounded?'#9debbb45':'#ffbd7555';ctx.fillRect(p.x*scalex,p.z*scalez,Math.ceil(scalex),Math.ceil(scalez))}}
ctx.lineWidth=2;ctx.strokeStyle='#ffffff28';for(let x=0;x<=dx;x+=16){ctx.beginPath();ctx.moveTo(x*scalex,0);ctx.lineTo(x*scalex,h);ctx.stroke()}for(let z=0;z<=dz;z+=16){ctx.beginPath();ctx.moveTo(0,z*scalez);ctx.lineTo(w,z*scalez);ctx.stroke()}
// Draw house bounding polygon
const corners=[[-19,-4],[53,-4],[53,39],[-19,39]].map(([x,z])=>{let q=rotate(x,z,placed.rot);return [(placed.x+q[0]-offset[0]+([180,270].includes(placed.rot)?1:0))*scalex,(placed.z+q[1]-offset[2]+([90,180].includes(placed.rot)?1:0))*scalez]});ctx.fillStyle='#edb96b20';ctx.strokeStyle='#ffcf84';ctx.lineWidth=3;ctx.setLineDash([11,6]);ctx.beginPath();ctx.moveTo(...corners[0]);corners.slice(1).forEach(pt=>ctx.lineTo(...pt));ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
// Anchor origin
let ox=(placed.x-offset[0]) * scalex,oz=(placed.z-offset[2])*scalez;ctx.beginPath();ctx.arc(ox,oz,7,0,Math.PI*2);ctx.fillStyle='#fff2c8';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#1f281d';ctx.stroke();
// Crafting table
const cx=earth.anchorLocal[0]*scalex,cz=earth.anchorLocal[2]*scalez;ctx.fillStyle='#f3b15d';ctx.strokeStyle='#1c261a';ctx.lineWidth=2;ctx.fillRect(cx-6,cz-6,12,12);ctx.strokeRect(cx-6,cz-6,12,12);ctx.fillStyle='#fff8df';ctx.font='bold 13px system-ui';ctx.fillText('Crafting Table',cx+12,cz+4);
ctx.fillStyle='#f2f1da';ctx.fillRect(w-51,8,42,27);ctx.fillStyle='#203326';ctx.font='bold 16px system-ui';ctx.fillText('N ↑',w-46,27);
}
let dragging=false;
function mapToWorld(evt){const c=$v('#siteMap'),r=c.getBoundingClientRect(),x=Math.floor((evt.clientX-r.left)*dx/r.width),z=Math.floor((evt.clientY-r.top)*dz/r.height);return {x:x+offset[0],z:z+offset[2]}}
$v('#siteMap').addEventListener('pointerdown',e=>{dragging=true;e.currentTarget.setPointerCapture(e.pointerId);const p=mapToWorld(e);setPlace({...placed,x:p.x,z:p.z},false)});
$v('#siteMap').addEventListener('pointermove',e=>{if(!dragging)return;const p=mapToWorld(e);if(p.x!==placed.x||p.z!==placed.z)setPlace({...placed,x:p.x,z:p.z},false)});
$v('#siteMap').addEventListener('pointerup',()=>dragging=false);$v('#siteMap').addEventListener('pointercancel',()=>dragging=false);
// Lightweight, dependency-free WebGL2 renderer for true visible voxel geometry.
function fallback2d(canvas){
 const ctx=canvas.getContext('2d'), wrap=$v('#site3dWrap');let yaw=2.3,pitch=.65,zoom=1,target=[60,43,56],pressed=false,px=0,py=0;
 wrap.insertAdjacentHTML('beforeend','<div style="background:#60462499;border:1px solid #cba36b99;border-radius:9px;color:#fff1cc;padding:8px 12px;font-size:11px;position:absolute;right:10px;bottom:10px;pointer-events:none">2,5D-Ersatzansicht · Höhenprofil, falls WebGL nicht verfügbar</div>');
 function project(x,y,z,s,w,h){let dx=x-target[0],dy=y-target[1],dz=z-target[2],co=Math.cos(yaw),si=Math.sin(yaw);let ax=dx*co-dz*si,az=dx*si+dz*co;return [w*.5+ax*s,h*.52+(az*Math.sin(pitch)-dy*Math.cos(pitch))*s]}
 function face(pts,c,alpha=1){ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.globalAlpha=1}
 function hex(c,m=1){return 'rgb('+c.map(v=>Math.floor(Math.min(255,v*m))).join(',')+')'}
 function render(){if(!isSite())return;let w=Math.round(canvas.clientWidth||640),h=Math.round(canvas.clientHeight||480);if(!w)return;canvas.width=w;canvas.height=h;const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#577660');grad.addColorStop(1,'#101d18');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 const scale=Math.min(w/160,h/125)*zoom;const cells=[];const step=(w<=450)?3:2;for(let z=0;z<dz;z+=step)for(let x=0;x<dx;x+=step){let idx=z*dx+x,c=topType[idx],v=topHeight[idx];if(v<0&&c!==255)continue;let y=c===255?Math.max(v,9):v,dep=(x-target[0])*Math.sin(yaw)+(z-target[2])*Math.cos(yaw);cells.push({x,z,y,c,dep})}cells.sort((a,b)=>a.dep-b.dep);
 for(const q of cells){if(q.y+offset[1]>+$v('#siteCut').value)continue;let {x,z,y,c}=q,C=c===255?[50,137,181]:colors[c],Y=y+1;let pp=(a,b,d)=>project(a,b,d,scale,w,h);let pts=[pp(x,Y,z),pp(Math.min(x+step,dx),Y,z),pp(Math.min(x+step,dx),Y,Math.min(z+step,dz)),pp(x,Y,Math.min(z+step,dz))];face(pts,hex(C,c===255?1:.95),c===255?.84:1);
 let nx=topHeight[z*dx+Math.min(dx-1,x+step)],nz=topHeight[Math.min(dz-1,z+step)*dx+x];if(nx<y-1){let pa=[pp(x+step,Y,z),pp(x+step,nx+1,z),pp(x+step,nx+1,z+step),pp(x+step,Y,z+step)];face(pa,hex(C,.65))}if(nz<y-1){let pa=[pp(x,Y,z+step),pp(x,y-(y-nz)+1,z+step),pp(x+step,nz+1,z+step),pp(x+step,Y,z+step)];face(pa,hex(C,.77))}}
 if($v('#siteShowHouse').checked){let topBlocks=[];for(let b of blocks){let t=toTerrain(b);if(t.y>dy+40||t.y<-20)continue;let depth=(t.x-target[0])*Math.sin(yaw)+(t.z-target[2])*Math.cos(yaw);topBlocks.push({b,t,depth})}topBlocks.sort((a,b)=>a.depth-b.depth);for(const rec of topBlocks){let {b,t}=rec,rgba=rgbaHex(PROJECT.items[b.type].hex),color=hex(rgba);if($v('#siteShowHits').checked&&volumeAt(t.x,t.y,t.z)===1)color='#ff503c';let p=(a,c,d)=>project(a,c,d,scale,w,h);let pts=[p(t.x,t.y+1,t.z),p(t.x+1,t.y+1,t.z),p(t.x+1,t.y+1,t.z+1),p(t.x,t.y+1,t.z+1)];face(pts,color,Math.max(.3,(+$v('#siteAlpha').value)/100))}}
 ctx.font='bold 12px system-ui';ctx.fillStyle='#f4e4cc';ctx.fillText('ECHTER GELÄNDEEXPORT · ISOMETRISCHE HÖHENKARTE',12,h-15)
 }
 function center(){let q=toTerrain({x:16,y:4,z:13});target=[q.x,q.y,q.z];zoom=1.3;requestRender()}
 function view(which){if(which==='north'){yaw=Math.PI;pitch=.4}else if(which==='west'){yaw=-Math.PI/2;pitch=.4}else if(which==='top'){yaw=Math.PI/4;pitch=1.54}else{yaw=2.3;pitch=.66}requestRender()}
 canvas.addEventListener('pointerdown',e=>{pressed=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!pressed)return;let dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;yaw+=dx*.009;pitch=Math.max(.1,Math.min(1.54,pitch+dy*.008));requestRender()});canvas.addEventListener('pointerup',()=>pressed=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(3,Math.max(.4,zoom*Math.exp(-e.deltaY*.001)));requestRender()},{passive:false});
 return {request:render,center,view,updateHits(){requestRender()}}
}

function webGLViewer(canvas){

 const world=HerbstgratWorld.create({canvas,earth,voxels:voxel,faces,blocks,items:PROJECT.items,placement:placed,isVisible:isSite,getBuilt:id=>!!state.placed[id],onStatus:status});
 window.HGSiteViewer=world;
 const sync=()=>{world.setPlacement(placed);world.setOptions({showTerrain:$v('#siteShowTerrain').checked,showWater:$v('#siteShowWater').checked,showHouse:$v('#siteShowHouse').checked,showHits:$v('#siteShowHits').checked,terrainCut:+$v('#siteCut').value,houseAlpha:+$v('#siteAlpha').value/100,houseCut:+(document.getElementById('siteHouseCut')?.value??21)});};
 return {request(){sync();world.request()},setPlacement:p=>world.setPlacement(p),updateHits:p=>world.updateHits(p),center:()=>world.center(),view:v=>world.view(v)};
}
function requestRender(){needsRender=true;if(isSite()&&siteGL)requestAnimationFrame(()=>{if(needsRender){needsRender=false;siteGL.request()}})}
$v('#siteCenterCamera').onclick=()=>siteGL?.center();[['siteViewNorth','north'],['siteViewWest','west'],['siteViewTop','top'],['siteViewIso','iso']].forEach(q=>$v('#'+q[0]).onclick=()=>siteGL?.view(q[1]));
async function setup(){try{status('Gelände wird entschlüsselt …');[voxel,faces]=await Promise.all([unzip(earth.voxData),unzip(earth.faceData)]);if(voxel.length!==dx*dy*dz||faces.length!==earth.countFaces*7)throw Error('Unvollständige Geländedaten');const paletteID=earth.palette.indexOf('minecraft:crafting_table');if(voxel[XYZ(30,57,80)]!==paletteID)throw Error('Crafting-Table-Kalibrierung stimmt nicht');
buildTop();try{siteGL=webGLViewer($v('#site3d'))}catch(renderError){console.warn('WebGL-Viewer nicht verfügbar, ersatzweise 2.5D',renderError);siteGL=fallback2d($v('#site3d'))}setPlace(placed,false);status('● Echtes Gelände geladen');}catch(e){status('⚠ Gelände nicht geladen');$v('#siteCollisionStats').textContent='Fehler beim Laden: '+e.message;console.error(e)}}
// Extend existing navigation without modifying legacy click handlers.
const oldNav=nav;
nav=function(id){oldNav(id);if(id==='site'){drawMap();requestRender()}};
/* preserved home shortcut */ ['worldX','worldY','worldZ','worldRot'].forEach(id=>{const f=document.getElementById(id);if(f)f.addEventListener('change',()=>{const w=state.world||placed;if(Number.isFinite(+w.x)&&Number.isFinite(+w.y)&&Number.isFinite(+w.z))setPlace({x:w.x,y:w.y,z:w.z,rot:w.rot},false)})});
syncInputs();setup();
})();
