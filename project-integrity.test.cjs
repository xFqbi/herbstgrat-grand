const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/project.js'),'utf8')+';this.project=PROJECT',ctx);const p=ctx.project;
assert.equal(p.blocks.length,9881);assert.equal(Object.keys(p.items).length,74);const occupied=new Set();
for(const[x,y,z,type,stage]of p.blocks){assert.ok([x,y,z].every(Number.isInteger));assert.ok(p.items[type],type);assert.equal(typeof stage,'string');const k=[x,y,z].join(',');assert.ok(!occupied.has(k),'Duplicate '+k);occupied.add(k)}
assert.equal(crypto.createHash('sha256').update(JSON.stringify(p.blocks)).digest('hex'),'0b634edc6494f97386753993efd404cca5a74f16a49509e49d84ada3f131672e','V8 block order and IDs must not change');
assert.equal(Math.min(...p.blocks.map(b=>b[1])),-19);assert.equal(Math.max(...p.blocks.map(b=>b[1])),20);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g))assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);
const studioCode=fs.readFileSync(path.join(root,'assets/legacy-9.js'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'HTML IDs must be unique');
for(const m of fs.readFileSync(path.join(root,'assets/legacy-9.js'),'utf8').matchAll(/\bget\('([^']+)'\)/g))assert.ok(ids.includes(m[1])||studioCode.includes('id="'+m[1]+'"'),'Missing studio control '+m[1]);
for(const file of fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',path.join(root,'assets',file)],{stdio:'pipe'});
assert.ok(html.includes('value="haus"'));assert.ok(fs.readFileSync(path.join(root,'assets/app.css'),'utf8').includes('prefers-reduced-motion'));
console.log(JSON.stringify({projectIntegrityPassed:true,unchangedV8Data:true,blockCount:9881,uniquePositions:true,controlsPresent:true,allScriptsParse:true,htmlBytes:Buffer.byteLength(html)}));
