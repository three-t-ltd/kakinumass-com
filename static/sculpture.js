import * as THREE from './three.module.min.js';

// Web visualization reconstructed from the supplied pulley-cover sketch/CAD/photo.
// Shape and joints are illustrative, not production CAD or dimensional specifications.
const host = document.getElementById('metal-canvas');
const stage = document.getElementById('sculpture-stage');
let renderer;
if (host && stage) try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia('(min-width: 1000px)').matches ? 1.6 : 1.25));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, .1, 9.7);
  camera.lookAt(0, 0, 0);
  const studio = document.createElement('canvas'); studio.width = 1024; studio.height = 512;
  const ctx = studio.getContext('2d');
  const backdrop = ctx.createLinearGradient(0, 0, 0, 512);
  backdrop.addColorStop(0, '#f5f6f3'); backdrop.addColorStop(.35, '#b2b7b7'); backdrop.addColorStop(.53, '#555e65'); backdrop.addColorStop(.75, '#a5abab'); backdrop.addColorStop(1, '#dfe2dd');
  ctx.fillStyle = backdrop; ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#fff'; ctx.fillRect(35, 20, 230, 350); ctx.fillRect(600, 30, 350, 210);
  ctx.fillStyle = '#343c43'; ctx.fillRect(380, 0, 100, 512);
  ctx.fillStyle = '#f8faf8'; ctx.fillRect(490, 130, 40, 300);
  const envMap = new THREE.CanvasTexture(studio); envMap.mapping = THREE.EquirectangularReflectionMapping; envMap.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envMap).texture;
  envMap.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5f666c, 1.4));
  const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-3, 5, 6); scene.add(light);

  const material = new THREE.MeshStandardMaterial({ color: 0xbfc5ca, metalness: .88, roughness: .38, envMapIntensity: 1.1 });
  const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x535f64, metalness: .8, roughness: .55 });
  const group = new THREE.Group(), solid = new THREE.Group(), wireframe = new THREE.Group();
  group.add(solid, wireframe); scene.add(group);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x526661, transparent: true, opacity: .8 });
  function addPart(geometry, position = [0,0,0], rotation = 0, mat = material, outlined = true) {
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...position); mesh.rotation.z = rotation; solid.add(mesh);
    if (outlined) { const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), edgeMaterial); edge.position.copy(mesh.position); edge.rotation.copy(mesh.rotation); wireframe.add(edge); }
    return mesh;
  }
  // Front plate: trapezoidal outline with a rounded T opening running to the bottom.
  const face = new THREE.Shape();
  face.moveTo(-1.87,-1.375); face.lineTo(-.975,-1.375); face.lineTo(-.975,-.23);
  face.quadraticCurveTo(-.975,-.17,-1.035,-.17); face.lineTo(-1.375,-.17);
  face.bezierCurveTo(-1.71,-.17,-1.71,.33,-1.375,.33); face.lineTo(-.225,.33);
  face.bezierCurveTo(.11,.33,.11,-.17,-.225,-.17); face.lineTo(-.565,-.17);
  face.quadraticCurveTo(-.625,-.17,-.625,-.23); face.lineTo(-.625,-1.375);
  face.lineTo(1.87,-1.375); face.lineTo(.13,1.375); face.lineTo(-1.87,1.375); face.closePath();
  const extrude = { depth: .018, bevelEnabled: true, bevelSegments: 2, bevelSize: .006, bevelThickness: .004, steps: 1, curveSegments: 20 };
  addPart(new THREE.ExtrudeGeometry(face, extrude), [0,0,.4]);
  const back = new THREE.Shape(); back.moveTo(-1.87,-1.375); back.lineTo(1.87,-1.375); back.lineTo(.13,1.375); back.lineTo(-1.87,1.375); back.closePath();
  addPart(new THREE.ExtrudeGeometry(back, extrude), [0,0,-.418]);
  // The inner rear surface appears through the one-sided opening.
  addPart(new THREE.ShapeGeometry(back), [0,0,-.395], 0, new THREE.MeshBasicMaterial({color:0x252b2f}), false);
  function bridge(a, b) {
    const length = Math.hypot(b[0]-a[0], b[1]-a[1]);
    addPart(new THREE.BoxGeometry(length,.018,.8), [(a[0]+b[0])/2,(a[1]+b[1])/2,0], Math.atan2(b[1]-a[1],b[0]-a[0]));
  }
  bridge([-1.87,1.375],[.13,1.375]);
  bridge([.13,1.375],[1.87,-1.375]);
  bridge([-1.87,-1.375],[-1.87,1.375]);
  // Mounting lips along the bottom, with the front opening kept unobstructed.
  addPart(new THREE.BoxGeometry(.895,.018,.17), [-1.4225,-1.375,.475]);
  addPart(new THREE.BoxGeometry(2.495,.018,.17), [.6225,-1.375,.475]);
  addPart(new THREE.BoxGeometry(3.74,.018,.17), [0,-1.375,-.475]);
  addPart(new THREE.BoxGeometry(.17,.018,.8), [1.92,-1.375,0]);
  // Small seam marks echo the supplied product photo; spacing is illustrative.
  const weldGeometry = new THREE.SphereGeometry(.022,8,6);
  for (let i=1;i<11;i++) { const t=i/11; const weld=addPart(weldGeometry,[.13+1.74*t,1.375-2.75*t,.422],0,seamMaterial,false); weld.scale.set(.8,1.7,.45); weld.rotation.z=.56; }
  for (let i=1;i<6;i++) { const weld=addPart(weldGeometry,[-1.87+2*i/6,1.378,.416],0,seamMaterial,false); weld.scale.set(1.5,.5,.8); }
  group.rotation.set(.2,-.52,-.04);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1000px) and (pointer: fine)');
  let paused = document.getElementById('motion-toggle').getAttribute('aria-pressed') === 'true';
  let visible = true, time = 0, pointerX = 0, pointerY = 0, lastTime = 0;
  let progress = Number(stage.dataset.scrollProgress || 0), frameId = 0, lost = false;
  let blend = 0, blendTarget = 0;
  const materials = [...new Set(solid.children.map(mesh => mesh.material))];
  materials.forEach(mat => { mat.transparent = true; });
  function applyBlend() {
    solid.visible = blend < .999; wireframe.visible = blend > .001;
    materials.forEach(mat => { mat.opacity = 1 - blend; mat.depthWrite = blend < .5; });
    edgeMaterial.opacity = blend * .8;
  }
  function setWire(wire) {
    blendTarget = wire ? 1 : 0;
    if (paused || reduced.matches || !visible) blend = blendTarget;
    applyBlend(); renderer.render(scene, camera);
  }
  function schedule() {
    if (!frameId && !paused && visible && !document.hidden && !lost) frameId = requestAnimationFrame(animate);
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w,h); camera.aspect=w/h;
    camera.position.z = camera.aspect < .85 ? 10.8 : 9.7;
    camera.updateProjectionMatrix(); renderer.render(scene,camera);
  }
  new ResizeObserver(resize).observe(host); resize();
  setWire(document.getElementById('view-structure').getAttribute('aria-pressed') === 'true');
  window.addEventListener('metal-view', e => setWire(e.detail.wire));
  window.addEventListener('metal-motion', e => { paused = e.detail.paused; if (paused) { cancelAnimationFrame(frameId); frameId = 0; } else schedule(); });
  window.addEventListener('metal-scroll', e => { if (!paused && !reduced.matches) progress = e.detail.progress; });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => { if (reduced.matches) { progress = 0; group.rotation.set(.2,-.52,-.04); group.position.y = 0; blend = blendTarget; applyBlend(); renderer.render(scene,camera); } });
  host.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || paused || reduced.matches || !desktop.matches) return;
    const bounds=host.getBoundingClientRect(); pointerX=(e.clientX-bounds.left)/bounds.width-.5; pointerY=(e.clientY-bounds.top)/bounds.height-.5;
  });
  host.addEventListener('pointerleave', () => { pointerX=0; pointerY=0; });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(stage);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; stage.classList.remove('webgl-ready'); cancelAnimationFrame(frameId); frameId = 0; document.getElementById('motion-toggle').hidden = true; });
  function animate(now) {
    frameId = 0;
    if (!visible || document.hidden || paused || lost) return;
    if (now - lastTime < (desktop.matches ? 32 : 50)) { schedule(); return; }
    const delta = Math.min((now - lastTime) / 1000, .05); lastTime = now;
    time += delta;
    const amount = reduced.matches ? 0 : desktop.matches ? 1 : .35;
    const scroll = reduced.matches || !desktop.matches ? 0 : progress;
    group.rotation.x += (.2 + scroll * .1 + (pointerY * .15 + Math.sin(time * .3) * .025) * amount - group.rotation.x) * .09;
    group.rotation.y += (-.52 + scroll * .32 + (pointerX * .35 + Math.sin(time * .25) * .12) * amount - group.rotation.y) * .09;
    group.rotation.z = -.04 + Math.sin(time * .22) * .015 * amount;
    group.position.y = Math.sin(time * .6) * .03 * amount;
    blend += (blendTarget - blend) * .13;
    if (Math.abs(blendTarget - blend) < .002) blend = blendTarget;
    applyBlend(); renderer.render(scene, camera);
    if (!reduced.matches) schedule();
  }
  schedule();
  renderer.render(scene,camera); stage.classList.add('webgl-ready');
} catch {
  if(renderer){renderer.dispose();renderer.domElement.remove();}
  document.getElementById('motion-toggle').hidden=true;
  console.info('Using the supplied pulley-cover reference image.');
}
