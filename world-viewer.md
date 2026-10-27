# Unified world renderer

`world-viewer.js` is a dependency-free WebGL2 renderer shared by the house studio and real-terrain planner. It uses the existing block IDs and project data without rewriting them. Built-in textures are original procedural previews; imported Minecraft/resource-pack files are never sent to a server or included in project exports.

## Integration

Load the script before the legacy adapters. `HerbstgratWorld.create(config)` is synchronous and returns an instance without creating a GPU context. The first visible `request()`/`draw()` initializes it. Supply:

```js
const viewer = HerbstgratWorld.create({
  canvas, blocks, items: PROJECT.items,
  earth, voxels, faces, // omit these three for a house-only scene
  placement: {x: -211, y: 112, z: -389, rot: 0},
  isVisible: () => container.classList.contains('active'),
  getBuilt: id => !!state.placed[id],
  onStatus: text => statusElement.textContent = text,
  onStats: stats => { /* blocks, houseFaces, terrainFaces, inferredShapes */ }
});
viewer.setOptions({terrainCut: 119, houseCut: 21, group: 'haus'});
viewer.request();
```

Options: `showTerrain`, `showHouse`, `showWater`, `showHits`, `terrainCut` (world Y), `houseCut` (house-local Y), `group` (`all`, `haus`, `rohbau`, `dach`, `natur`, `innen`, `keller`), `hideRoof`, `hideBuilt`, `houseAlpha` (0.05–1). Terrain sections receive new horizontal cap faces from the voxel volume; house sections rebuild occupancy so their exposed cut faces remain visible.

Methods: `request()` queues a coalesced frame, `draw()` renders synchronously (use before a screenshot), `refresh()`/`rebuild()` invalidate house geometry, `setPlacement(p)`, `setOptions(o)`, `updateHits(points)` (terrain-local centers), `center()` (house), `center('terrain')`, `view(name)` (`north`, `west`, `top`, `iso`, `front`, `side`, `back`), `setCamera({yaw,pitch,distance,target})`, `getCamera()`, `getStats()`, and `dispose()`.

`HerbstgratWorld.importTextures(file)` and `resetTextures()` are asynchronous and shared across all instances. Import returns `{loaded, needed, original, preview, skipped, persisted}`. `textureReport()` returns the current shared counts. Imports are stored in IndexedDB when available; denied storage leaves them usable in memory. The legacy V8 atlas cache is deliberately not relabeled as a complete original texture collection.

## Coordinates and terrain encoding

The terrain volume is indexed `(y * sizeZ + z) * sizeX + x`, with size `[120,67,116]` and offset `[-240,53,-434]`. Local `[30,57,80]` maps to world `[-210,110,-354]`; the voxel there is the crafting table.

Each exported greedy face is seven bytes: `[x,y,z,span1,span2,face,paletteIndex+1]`. Faces 0–5 are +X, −X, +Y, −Y, +Z, −Z. X faces use height/depth spans; Y faces use depth/width spans; Z faces use height/width spans. Physical UV coordinates repeat the texture once per block, including across long greedy faces. Side textures stay upright.

Placement rotates **integer block cells**, matching the collision/CSV logic: 90° maps `(x,z)` to `(z,−x)`. Rendered cube corners receive a one-cell correction on reversed axes. Without that correction the old corner rotation placed 90°/180°/270° geometry one block away from its collision coordinates.

## Texture fidelity

The importer accepts ZIP/JAR stored and raw-deflate entries, up to a 512 MB archive. It loads required `assets/<namespace>/textures/block/*.png` textures and preserves namespaces. It recognizes vanilla single-chest and ender-chest entity atlases and composites their front lid/body regions into the simplified block material. Minecraft client JARs and Promenade mod JARs can be imported successively.

Textures normalize to 32×32 with nearest-neighbor sampling. Animated strips use their first square frame. Standard grayscale vanilla leaves, vines, and grass tops receive a fixed green tint during GPU upload; baked-color textures and procedural previews do not receive a second tint. Exact biome colors, animation, PBR materials, resource-pack model inheritance, custom blockstate/model JSON, connected textures, random variants, and shader packs are not implemented. Resource-pack model aliases may therefore remain previews even when another texture could be used for them. Missing textures remain individually counted previews; a partial import is never described as a complete original pack.

## Geometry limits

The terrain export has palette names and greedy faces but **no blockstate properties**. Duplicate palette names cannot recover their missing facing/half/axis data. Existing terrain surfaces remain the exported voxel geometry, including cube approximations for non-cube blocks.

For house blocks, optional `properties`, `blockstates`, or `state` properties can supply stair `facing`/`half` and slab `type`. Existing data omits them, so straight stair directions use adjacency and slabs default to bottom placement; inferred shapes are counted in `inferredShapes`. Inner/outer stair corners, exact fence connections, door/trapdoor orientation, chest lid/lock models, furniture models, and full Minecraft blockstate rendering remain approximations. House glass uses thin panes, stairs use two boxes, and slabs use half-height geometry. Collision accounting intentionally remains owned by the original volume logic and treats these cells as full blocks.

Opaque/cutout geometry writes depth first. Water/glass and a faded house use a separate alpha pass without depth writes. This is not order-independent transparency; overlapping transparent surfaces can show ordering artifacts. Leaves use alpha cutouts. The fallback is explicitly a simplified isometric color view, not a textured or exact 3D substitute.

## Performance and lifecycle

No permanent animation loop. Frames coalesce after input, changes, texture restoration, and resize; invisible canvases return before initialization. DPR is capped at 1.6 with a 2400×1600 maximum backing surface. Geometry rebuilds only after relevant filters, and terrain cap changes rebuild only the cap. Face culling removes hidden full-block house faces. Textures use a 2D array to avoid atlas bleeding and stretching. WebGL context restoration rebuilds resources; unavailable WebGL uses a separate Canvas2D surface if the original canvas already owns a failed WebGL context. `dispose()` removes listeners/observers and releases GPU resources.

## Verification

Run `node tests/world-viewer.test.cjs` from any working directory. On the shipped data the tests verify 25,637 terrain faces, 9,881 unchanged house blocks, 40,743 generated house faces, and 1,915 inferred stair/slab shapes. They check 16 cell-rotation cases at all four quarter turns, the crafting-table anchor, volume sizes, terrain bounds, all six greedy-face orientations, repeated upright UVs, hidden interior faces, newly exposed house cuts, category/hide-built filtering, explicit stair properties, and alpha-cutout preview pixels.

ZIP regression tests use real stored and deflated ZIP payloads with a narrow PNG-canvas fake and Node raw-deflate adapter. They verify namespace isolation, chest atlas crops, first-frame extraction, malformed archives, size rejection, partial counts, and reset. These tests do not claim native browser PNG decoding, GPU rendering, IndexedDB persistence, or native browser `deflate-raw` support; those require the app's browser QA. Full house geometry construction measured about 117–160 ms in Node on this machine; browser/device performance may differ.
