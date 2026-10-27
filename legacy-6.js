
/* V7 supplementary features: retained V5 storage key, append-only block model. */
(()=>{
 const v7Stages=['dachdetails','fassadendetails','klippendetails','laublayer','lichtdetails','innen_eg','geheim_vorbereitung'];
 const ownStages=['dachdetails','fassadendetails','klippendetails','laublayer','lichtdetails'];
 const v7blocks=blocks.filter(b=>v7Stages.includes(b.stage));
 const outdoor=v7blocks.filter(b=>ownStages.includes(b.stage));
 const rooms=[
 {key:'workshop',label:'Werkstatt',group:'Westflügel',x1:-13,x2:-3,z1:16,z2:20,color:'#b59372',desc:'Werkbank, Schmelzöfen, Steinsäge, Schmiedetisch, Amboss und Arbeitsfässer. In direkter Nähe zum Vorratslager.'},
 {key:'storage',label:'Schnelllager',group:'Westflügel',x1:-13,x2:-3,z1:22,z2:26,color:'#779a87',desc:'Kisten und Fässer an den Außenwänden, Mittelgang freihalten. Der Übergang zur Werkstatt liegt bei Z 21.'},
 {key:'hall',label:'Kaminhalle',group:'Mittelbau',x1:2,x2:13,z1:16,z2:27,color:'#bb9561',desc:'Steinkamin, großer Esstisch, Sitzmöbel und Teppiche mit Blick aufs Meer.'},
 {key:'kitchen',label:'Küche',group:'Rechter Hauptflügel',x1:16,x2:23,z1:11,z2:17,color:'#987b61',desc:'Öfen, Räucheröfen und Fässer direkt neben dem Eingangsbereich.'},
 {key:'foyer',label:'Eingang',group:'Rechter Hauptflügel',x1:25,x2:34,z1:11,z2:17,color:'#b2a078',desc:'Haupttür an Z 10, ausreichend Platz für Treppe und Laufwege freilassen.'},
 {key:'lounge',label:'Aussichtslounge',group:'Rechter Hauptflügel',x1:16,x2:34,z1:19,z2:28,color:'#678f91',desc:'Lange Glasfront, gemütliche Sitzgruppe und Pflanzen zum Meer und Wasserfall.'}];
 const categoryNames={dachdetails:'Dach & First',fassadendetails:'Fenster & Fassade',klippendetails:'Klippenstützen',laublayer:'Herbstlaub',lichtdetails:'Licht & Ketten'};
 const sections=[['dachdetails','Dachkanten aufwerten','Erst Hauptdach fertig bauen, dann Stufen/First und Schornstein prüfen.'],['fassadendetails','Fenster & Pflanzkästen','Falltüren seitlich neben Glasflächen und einzelne Blumentöpfe.'],['klippendetails','Stützbalken ergänzen','Dunkle Diagonalstreben unter vorhandenen Balkon- und Terrassenteilen.'],['laublayer','Herbstnatur anwachsen lassen','Orange, rote und goldene Blattinseln – Fenster freihalten.'],['lichtdetails','Beleuchtung finalisieren','Ketten und Laternen bei den vorspringenden Fassadenteilen.']];
 const $v7=id=>document.getElementById(id);
 let active='all',y=3,room=rooms[0];
 const bpos=(b)=>b.x+','+b.y+','+b.z;
 function isV7(){return $v7('view-v7design').classList.contains('active')}
 function check(s){return !!state.tasks['v7_'+s]}
 function commit(s,v){state.tasks['v7_'+s]=v;save();tasks();roomsRender();progress();}
 function filters(){const holder=$v7('v7DecorFilters');holder.innerHTML='';[['all','Alle Details'],...ownStages.map(s=>[s,categoryNames[s]])].forEach(([k,l])=>{const b=document.createElement('button');b.className='v7Filter '+(k===active?'active':'');b.textContent=l;b.onclick=()=>{active=k;filters();drawDetails()};holder.appendChild(b)})}
 function tasks(){const e=$v7('v7DecorTasks');e.innerHTML='';for(const [k,title,desc] of sections){const d=document.createElement('label');d.className='v7Checkrow';d.innerHTML='<input type="checkbox" '+(check(k)?'checked':'')+'><div><b>'+title+'</b><p>'+desc+'</p><small>'+blocks.filter(b=>b.stage===k).length+' Blöcke im Detailplan</small></div>';d.querySelector('input').onchange=a=>commit(k,a.target.checked);e.appendChild(d)}}
 function progress(){const done=outdoor.filter(b=>state.placed[b.id]).length;$v7('v7DecorProgress').textContent=Math.round(100*done/Math.max(outdoor.length,1))+' %';$v7('v7Added').textContent=v7blocks.length.toLocaleString('de-DE');$v7('v7ExteriorCount').textContent=outdoor.length.toLocaleString('de-DE');$v7('v7InsideDone').textContent=rooms.filter(r=>check(r.key)).length+' / '+rooms.length}
 function canvasBuild(id,pixels,rows,cols){const c=$v7(id);const dpi=window.devicePixelRatio||1;c.style.width=cols*pixels+'px';c.style.height=rows*pixels+'px';c.width=Math.round(cols*pixels*dpi);c.height=Math.round(rows*pixels*dpi);const ctx=c.getContext('2d');ctx.setTransform(dpi,0,0,dpi,0,0);ctx.clearRect(0,0,cols*pixels,rows*pixels);return [c,ctx]}
 const minX=-19,minZ=-4,cols=72,rows=43;
 function drawDetails(){if(!isV7())return;const size=12,[c,ctx]=canvasBuild('v7DecorCanvas',size,rows,cols);ctx.fillStyle='#12231a';ctx.fillRect(0,0,cols*size,rows*size);for(let x=0;x<cols;x++){for(let z=0;z<rows;z++){if(x%5===0||z%5===0){ctx.strokeStyle='#32483b';ctx.strokeRect(x*size,z*size,size,size)}}}
 // show existing structural footprint faded for localization
 for(const b of byY.get(y)||[]){if(v7Stages.includes(b.stage))continue;ctx.globalAlpha=.14;ctx.fillStyle=PROJECT.items[b.type].hex;ctx.fillRect((b.x-minX)*size+1,(b.z-minZ)*size+1,size-2,size-2)}ctx.globalAlpha=1;
 let current=outdoor.filter(b=>b.y===y&&(active==='all'||b.stage===active));for(const b of current){ctx.globalAlpha=state.placed[b.id]?.35:1;ctx.fillStyle=PROJECT.items[b.type].hex;ctx.fillRect((b.x-minX)*size+1,(b.z-minZ)*size+1,size-2,size-2)}ctx.globalAlpha=1;ctx.strokeStyle='#f8c48b';ctx.lineWidth=2;ctx.strokeRect((0-minX)*size,(0-minZ)*size,size,size);
 $v7('v7DecorYText').textContent='Y '+y;$v7('v7DecorY').value=y;$v7('v7DecorCaption').textContent=current.length+' Details an dieser Höhe · Plan-Nullpunkt gelb markiert';
 let m=new Map();for(const b of current){const n=PROJECT.items[b.type].name;m.set(n,(m.get(n)||0)+1)}$v7('v7DecorLegend').innerHTML=[...m].slice(0,7).map(([name,n])=>'<span>'+n+' × '+esc(name)+'</span>').join('')||'<span>Auf dieser Höhe keine Zusatzdetails</span>'}
 $v7('v7DecorY').oninput=e=>{y=+e.target.value;drawDetails()};$v7('v7DecorJump').onclick=()=>{state.level=y;state.stage=active==='all'?'V7 · Fassadendetails':(mapping[active]||'V7 · Fassadendetails');$('#layerSlider').value=state.level;$('#layerStage').value=state.stage;save();nav('layers');drawLayer()};$v7('v7OpenLayer').onclick=$v7('v7DecorJump').onclick;$v7('v7OpenModel').onclick=()=>nav('model');
 function inRoom(b,r){return b.x>=r.x1&&b.x<=r.x2&&b.z>=r.z1&&b.z<=r.z2&&b.y>=1&&b.y<=4&&b.stage==='innen_eg'}
 function roomItems(r){const cnt=new Map();for(const b of v7blocks){if(inRoom(b,r)){const name=PROJECT.items[b.type].name;cnt.set(name,(cnt.get(name)||0)+(b.type==='door'?.5:1))}}return [...cnt].sort((a,b)=>b[1]-a[1])}
 function drawFloor(){const scale=13,[c,ctx]=canvasBuild('v7FloorCanvas',scale,rows,cols);ctx.fillStyle='#11251b';ctx.fillRect(0,0,cols*scale,rows*scale);
 // real physical footprint and wall/window positions at Y1
 for(const b of byY.get(0)||[]){ctx.fillStyle='#5b614f';ctx.globalAlpha=.5;ctx.fillRect((b.x-minX)*scale,(b.z-minZ)*scale,scale,scale)}ctx.globalAlpha=1;
 for(const r of rooms){const x=(r.x1-minX)*scale,z=(r.z1-minZ)*scale,w=(r.x2-r.x1+1)*scale,h=(r.z2-r.z1+1)*scale;ctx.fillStyle=r.color+(r.key===room.key?'cc':'66');ctx.fillRect(x,z,w,h);ctx.strokeStyle=r.key===room.key?'#ffe1a0':'#b6baaa';ctx.lineWidth=r.key===room.key?3:1.5;ctx.strokeRect(x,z,w,h);ctx.fillStyle='#fff5dd';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(r.label,x+w/2,z+h/2+4)}
 for(const b of byY.get(1)||[]){if(b.stage==='innen_eg')continue;if(!['wall','beam','glass','door'].includes(b.type))continue;ctx.fillStyle=PROJECT.items[b.type].hex;ctx.fillRect((b.x-minX)*scale+3,(b.z-minZ)*scale+3,scale-6,scale-6)}
 for(const b of blocks.filter(b=>b.y===1&&b.stage==='innen_eg')){ctx.fillStyle=PROJECT.items[b.type].hex;ctx.fillRect((b.x-minX)*scale+4,(b.z-minZ)*scale+4,scale-8,scale-8)}
 const refX=(0-minX)*scale;const refZ=(0-minZ)*scale;ctx.strokeStyle='#f4c487';ctx.strokeRect(refX,refZ,scale,scale);
 }
 $v7('v7FloorCanvas').onclick=e=>{const c=$v7('v7FloorCanvas'),r=c.getBoundingClientRect(),xx=Math.floor((e.clientX-r.left)*c.width/r.width/((window.devicePixelRatio||1)*13))+minX,zz=Math.floor((e.clientY-r.top)*c.height/r.height/((window.devicePixelRatio||1)*13))+minZ;const nr=rooms.find(r=>xx>=r.x1&&xx<=r.x2&&zz>=r.z1&&zz<=r.z2);if(nr){room=nr;roomsRender()}};
 function roomsRender(){drawFloor();$v7('v7RoomTitle').textContent=room.label;$v7('v7RoomDesc').textContent=room.desc;$v7('v7RoomStats').innerHTML='<div><small>Haus-X</small><strong>'+room.x1+'…'+room.x2+'</strong></div><div><small>Haus-Z</small><strong>'+room.z1+'…'+room.z2+'</strong></div><div><small>Umriss</small><strong>'+(room.x2-room.x1+1)+' × '+(room.z2-room.z1+1)+'</strong></div><div><small>Neuer EG-Layer</small><strong>'+v7blocks.filter(b=>inRoom(b,room)).length+'</strong></div>';
 $v7('v7RoomMaterials').innerHTML=roomItems(room).map(([n,c])=>'<div><span>'+esc(n)+'</span><b>'+Math.ceil(c)+'</b></div>').join('')+'<p class="tiny">Nur im V7-Layer ergänzte Blöcke. Die ursprünglichen Boden-/Wandblöcke sind hier nicht enthalten.</p>';
 const w=state.world||{x:0,y:100,z:0,rot:0};const rr=((+w.rot||0)%360+360)%360;const rotate=(xx,zz)=>rr===90?[zz,-xx]:rr===180?[-xx,-zz]:rr===270?[-zz,xx]:[xx,zz];const base=rotate(room.x1,room.z1);const worldX=(+w.x||0)+base[0],worldZ=(+w.z||0)+base[1];$v7('v7RoomStats').insertAdjacentHTML('beforeend','<div><small>Welt-Eckpunkt X / Z</small><strong style="font-size:15px">'+worldX+' / '+worldZ+'</strong></div><div><small>Welt-Bodenhöhe</small><strong>'+(+w.y||0)+'</strong></div>');
 const c=$v7('v7RoomChecklist');c.innerHTML='';for(const r of rooms){const l=document.createElement('label');l.className='v7Checkrow';l.innerHTML='<input type="checkbox" '+(check(r.key)?'checked':'')+'><div><b>'+esc(r.label)+'</b><p>'+esc(r.group)+'</p></div><button class="v7RoomPoint" type="button">Anzeigen</button>';l.querySelector('input').onchange=e=>commit(r.key,e.target.checked);l.querySelector('button').onclick=()=>{room=r;roomsRender()};c.appendChild(l)};
 $v7('v7RoomDone').textContent=check(room.key)?'✓ Raum erledigt':'Raum abhaken ✓';progress()}
 $v7('v7RoomDone').onclick=()=>commit(room.key,!check(room.key));$v7('v7RoomJump').onclick=()=>{$('#layerStage').value='V7 · Erdgeschoss';state.stage='V7 · Erdgeschoss';state.level=1;$('#layerSlider').value=1;nav('layers');drawLayer()};$v7('v7InsideLayer').onclick=$v7('v7RoomJump').onclick;$v7('v7InsideModel').onclick=()=>nav('model');
 const prevNav=nav;nav=function(id){prevNav(id);document.body.classList.toggle('v7Page',id==='v7design'||id==='v7inside');if(id==='v7design'){progress();drawDetails()}if(id==='v7inside')roomsRender()};
 // Update home entry; safely attach after old sections init and without mutating old task keys.
 const launch=document.createElement('button');launch.className='btn gold';launch.textContent='✺ NEU · V7 Fassaden & Innenräume entdecken →';launch.style.marginTop='10px';launch.onclick=()=>nav('v7design');$('#view-home').appendChild(launch);
 filters();tasks();progress();roomsRender();if(state.tab==='v7design'||state.tab==='v7inside')nav(state.tab);
})();
