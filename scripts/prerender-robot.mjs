// Render a calm headless body video and sharp cursor-controlled head photographs.
// This build-time tool is deliberately separate from the website's browser bundle.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp, copyFile, rename, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dependencies = process.env.ROBOT_RENDER_DEPENDENCIES;
const require = createRequire(dependencies ? path.join(dependencies, 'package.json') : import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const runtimeRoot = path.join(root, 'node_modules/@splinetool/runtime/build');
const output = path.join(root, 'public/robot');
const renderSize = 1280;
const crop = { left: 100, top: 150, width: 1080, height: 754 };
const bodyWidth = 1024;
const bodyHeight = 715;
const fps = 30;
const seconds = 10;
const headPatch = { left: 320, top: 0, width: 384, height: 384 };
const headFrameCount = 360;
const headTileColumns = 15;
const assets = [['poster.webp', 'poster-v8.webp'], ['loop.webm', 'body-loop-v8.webm'], ...Array.from({ length: headFrameCount / headTileColumns }, (_, tile) => [`head-t${tile}.webp`, `head-v8-t${tile}.webp`])];
if (!process.env.ROBOT_RENDER_MATERIAL_INSPECT) {
  for (const [, publicName] of assets) {
    const exists = await access(path.join(output, publicName)).then(() => true, () => false);
    if (exists) throw new Error(`Immutable asset ${publicName} already exists. Bump every output version before rendering.`);
  }
}
const framesDirectory = process.env.ROBOT_RENDER_FRAMES_DIRECTORY || await mkdtemp(path.join(tmpdir(), 'autopilot-robot-loop-'));
const ffmpeg = process.env.ROBOT_RENDER_FFMPEG;
if (!ffmpeg) throw new Error('Set ROBOT_RENDER_FFMPEG to an FFmpeg executable with libvpx-vp9 support.');
await mkdir(output, { recursive: true });
await mkdir(framesDirectory, { recursive: true });
console.log('Offline frames directory:', framesDirectory);

const html = `<!doctype html><html><style>html,body{margin:0;background:transparent;overflow:hidden}canvas{display:block;width:${renderSize}px;height:${renderSize}px}</style><canvas id="robot"></canvas><script type="module">
import { Application } from '/runtime/runtime.js';
window.app = new Application(document.querySelector('canvas'), { renderMode: 'auto' });
await app.load('/robot.splinecode');
app.setBackgroundColor('transparent');
app.setSize(${renderSize},${renderSize});
app.setGlobalEvents(true);
window.ready = true;
</script></html>`;
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end(html);
      return;
    }
    const name = request.url?.split('?')[0];
    const file = name === '/robot.splinecode'
      ? path.join(root, 'public/spline/friendly-robot.splinecode')
      : path.join(runtimeRoot, path.basename(name || ''));
    response.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream');
    response.end(await readFile(file));
  } catch (error) { response.statusCode = 404; response.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: process.env.ROBOT_RENDER_BROWSER, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: renderSize, height: renderSize }, deviceScaleFactor: 1 });
  page.on('console', message => console.log(message.text()));
  page.on('pageerror', error => console.log('Browser error:', error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.ready, { timeout: 120000 });
  await page.waitForTimeout(6500);
  await page.evaluate(async () => {
    app.stop();
    app.setZoom(0.84);
    app.findObjectByName('Camera 2').state = 0;
    window.frozenTime = app.time;
    app.findObjectByName('Top part').rotation.x = 0;
    app.findObjectByName('Top part').rotation.y = 0;
    app.findObjectByName('Head').rotation.x = 0.16;
    app.findObjectByName('Head').rotation.y = 0;
    window.sourceObjects = app.getAllObjects();
    window.joints = window.sourceObjects.filter(o => ['Top part', 'Hand LEFT'].includes(o.name)).map(o => ({
      uuid: o.uuid, name: o.name, x: o.rotation.x, y: o.rotation.y, z: o.rotation.z, positionY: o.position.y,
    }));
    window.originalVisibility = window.sourceObjects.map(o => ({ uuid: o.uuid, visible: o.visible }));
    const headId = app.findObjectByName('Head').uuid;
    // Copy the complete source torso material, including its original woven
    // bump map, matcap and iridescent layer. Update materials in place so Spline
    // shape/Instance references remain valid, preserving geometry and UVs.
    const bodyMesh = app._scene.getObjectByProperty('uuid', app.findObjectByName('Body').uuid);
    const bodyMaterial = Array.isArray(bodyMesh.material) ? bodyMesh.material[0] : bodyMesh.material;
    if (!bodyMaterial) throw new Error('Original torso material is unavailable.');
    const bodyData = structuredClone(bodyMaterial.data);
    const weave = structuredClone(bodyData.layers.find(layer => layer.data.type === 'texture'));
    weave.id = crypto.randomUUID();
    weave.data.alpha = 0.2;
    weave.data.mode = 0;
    // Spline reverses the source layer order. Place a small weave contribution
    // after lighting so the shadowed shoulder retains visible carbon detail.
    bodyData.layers.unshift(weave);
    const updatedMaterials = new Set();
    let matchedMeshes = 0;
    app._scene.traverse(mesh => {
      let ancestor = mesh;
      let isHead = false;
      while (ancestor) { if (ancestor.uuid === headId) { isHead = true; break; } ancestor = ancestor.parent; }
      if (isHead || !mesh.isMesh || !mesh.material) return;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (updatedMaterials.has(material)) continue;
        material.reset(structuredClone(bodyData), { shared: app._sharedAssetsManager, scene: app._scene }, true);
        material.needsUpdate = true;
        updatedMaterials.add(material);
      }
      matchedMeshes++;
    });
    bodyMaterial.needsUpdate = true;
    console.log('Meshes using matching original textured torso settings:', matchedMeshes);
    const lights = [];
    app._scene.traverse(object => { if (object.isLight) lights.push(object); });
    const keyLight = lights.find(light => light.isPointLight);
    if (!keyLight) throw new Error('Original studio point light is unavailable.');
    const fillLight = keyLight.clone();
    fillLight.name = 'Carbon texture fill';
    const camera = app._scene.getObjectByProperty('uuid', app.findObjectByName('Camera 2').uuid);
    const cameraRotation = camera.getWorldQuaternion(camera.quaternion.clone());
    const cameraFront = keyLight.position.clone().set(0, 0, 1).applyQuaternion(cameraRotation);
    const cameraUp = keyLight.position.clone().set(0, 1, 0).applyQuaternion(cameraRotation);
    const bodyCenter = bodyMesh.getWorldPosition(bodyMesh.position.clone());
    const fillWorld = bodyCenter.clone().addScaledVector(cameraFront, 550).addScaledVector(cameraUp, 400);
    fillLight.position.copy(keyLight.parent.worldToLocal(fillWorld));
    fillLight.intensity = keyLight.intensity * 0.35;
    fillLight.castShadow = false;
    keyLight.parent.add(fillLight);
  });
  if (process.env.ROBOT_RENDER_MATERIAL_INSPECT) {
    const preview = await page.evaluate(() => { for (let i = 0; i < 24; i++) app.render(window.frozenTime); return app.canvas.toDataURL('image/png').split(',')[1]; });
    await sharp(Buffer.from(preview, 'base64')).extract(crop).resize(bodyWidth, bodyHeight).flatten({ background: '#f7f8fa' }).png().toFile(path.join(framesDirectory, 'neutral-textured.png'));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    process.exit(0);
  }
  const neutral = await page.evaluate(() => {
    for (let i = 0; i < 24; i++) app.render(window.frozenTime);
    return app.canvas.toDataURL('image/png').split(',')[1];
  });
  await sharp(Buffer.from(neutral, 'base64')).extract(crop).resize(bodyWidth, bodyHeight).png().toFile(path.join(framesDirectory, 'neutral-complete.png'));
  await page.evaluate(() => {
    const head = app.findObjectByName('Head');
    const objects = window.sourceObjects;
    const byId = new Map(objects.map(o => [o.uuid, o]));
    const ancestors = new Set();
    let parent = byId.get(head.parentUuid);
    while (parent) { ancestors.add(parent.uuid); parent = byId.get(parent.parentUuid); }
    const descendantOfHead = object => {
      let cursor = object;
      while (cursor) { if (cursor.uuid === head.uuid) return true; cursor = byId.get(cursor.parentUuid); }
      return false;
    };
    for (const object of objects) object.visible = ancestors.has(object.uuid) || descendantOfHead(object) || /Light|Camera/.test(object.type);
  });
  for (let tile = 0; tile < headFrameCount / headTileColumns; tile++) {
    const pictures = [];
    for (let column = 0; column < headTileColumns; column++) {
      // Shift the seam and initial direction into tile interiors: tile 0
      // spans 353..7 degrees, and tile 6/local 7 is the default 90 degrees.
      const angle = (tile * headTileColumns + column - 7 + headFrameCount) % headFrameCount;
      const data = await page.evaluate(({ angle }) => {
        const head = app.findObjectByName('Head');
        const radians = angle / 180 * Math.PI;
        head.rotation.y = 0.38 * Math.cos(radians);
        head.rotation.x = 0.16 * Math.sin(radians);
        for (let i = 0; i < 16; i++) app.render(window.frozenTime);
        return app.canvas.toDataURL('image/png').split(',')[1];
      }, { angle });
      const upperBody = await sharp(Buffer.from(data, 'base64')).extract(crop).resize(bodyWidth, bodyHeight).png().toBuffer();
      const patch = await sharp(upperBody).extract(headPatch).png().toBuffer();
      pictures.push(patch);
    }
    const strip = await sharp({ create: { width: headTileColumns * headPatch.width, height: headPatch.height, channels: 4, background: '#00000000' } })
      .composite(pictures.map((input, index) => ({ input, left: index * headPatch.width, top: 0 })))
      .webp({ lossless: true }).toBuffer();
    await writeFile(path.join(framesDirectory, `head-t${tile}.webp`), strip);
    console.log(`Rendered head tile ${tile + 1}/${headFrameCount / headTileColumns}`);
  }
  await page.evaluate(() => {
    window.originalVisibility.forEach(base => { const object = app.findObjectById(base.uuid); if (object) object.visible = base.visible; });
    app.findObjectByName('Head').hide();
  });
  console.log('Animated original joints:', await page.evaluate(() => window.joints.map(o => o.name)));
  for (let index = 0; index < fps * seconds; index++) {
      const data = await page.evaluate(({ index, count }) => {
        const phase = index / count * Math.PI * 2;
        window.joints.forEach(base => {
          const object = app.findObjectById(base.uuid);
          object.rotation.x = base.x;
          object.rotation.y = base.y;
          object.rotation.z = base.z;
          if (base.name === 'Top part') {
            object.rotation.y += 0.008 * Math.sin(phase);
            object.rotation.x += 0.003 * Math.sin(phase * 2);
            object.position.y = base.positionY + 0.15 * Math.sin(phase * 2);
          } else {
            // Both original rigid shoulder groups move; the mirrored Instance
            // parent and internal arm/elbow parts remain untouched.
            object.rotation.z += 0.032 * Math.sin(phase);
            object.rotation.x += 0.012 * Math.sin(phase * 2);
          }
        });
        // All source timelines remain frozen. Each pose is rendered fully before
        // encoding, without interpolated photographs or artificial motion blur.
        for (let i = 0; i < 16; i++) app.render(window.frozenTime);
        return app.canvas.toDataURL('image/png').split(',')[1];
      }, { index, count: fps * seconds });
      const source = Buffer.from(data, 'base64');
      const picture = await sharp(source).extract(crop).resize(bodyWidth, bodyHeight).png().toBuffer();
      await writeFile(path.join(framesDirectory, `frame-${String(index).padStart(4, '0')}.png`), picture);
      console.log(`Rendered loop frame ${index + 1}/${fps * seconds}`);
  }
  // Build the SSR poster from the same two layers used by the website. Hiding
  // the head can change source lighting, so a complete scene screenshot would
  // otherwise differ from the first headless video frame.
  const initialHead = await sharp(path.join(framesDirectory, 'head-t6.webp'))
    .extract({ left: 7 * headPatch.width, top: 0, width: headPatch.width, height: headPatch.height }).png().toBuffer();
  await sharp(path.join(framesDirectory, 'frame-0000.png'))
    .composite([{ input: initialHead, left: headPatch.left, top: headPatch.top }])
    .webp({ lossless: true }).toFile(path.join(framesDirectory, 'poster.webp'));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
await new Promise((resolve, reject) => {
  const encoder = spawn(ffmpeg, ['-y', '-hide_banner', '-framerate', String(fps), '-i', path.join(framesDirectory, 'frame-%04d.png'), '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '16', '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-auto-alt-ref', '0', path.join(framesDirectory, 'loop.webm')], { stdio: 'inherit', windowsHide: true });
  encoder.on('error', reject);
  encoder.on('exit', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}`)));
});
for (const [sourceName, publicName] of assets) {
  const staged = path.join(output, `.${publicName}.tmp`);
  await copyFile(path.join(framesDirectory, sourceName), staged);
  await rename(staged, path.join(output, publicName));
}
