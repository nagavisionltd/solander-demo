'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

type WorldId = 'LOBBY' | 'NEUTRAL' | 'HERO' | 'DARK';
type ModelSpec = { title: string; path: string; format: 'gltf' | 'obj' | 'dae'; folder: string; file: string; mtl?: string; tint: number; description: string };
const ROOT = 'https://raw.githubusercontent.com/nagavisionltd/solander-demo/main/sa2b_assets/chao_garden_assets/';
const WORLDS: Record<Exclude<WorldId, 'LOBBY'>, ModelSpec> = {
  NEUTRAL: { title: 'Neutral Garden', path: 'chao-garden/chao_garden.glb', format: 'gltf', folder: 'chao-garden/', file: 'chao_garden.glb', tint: 0x9bc9f3, description: 'The central garden — a place to nurture, play and grow.' },
  HERO: { title: 'Hero Garden', path: 'Hero Chao Garden/HeroGarden.obj', format: 'obj', folder: 'Hero Chao Garden/', file: 'HeroGarden.obj', mtl: 'HeroGarden.mtl', tint: 0xb6e9c0, description: 'A bright sanctuary for kind-hearted Chao.' },
  DARK: { title: 'Dark Garden', path: 'Dark Chao Garden/DarkGarden.dae', format: 'dae', folder: 'Dark Chao Garden/', file: 'DarkGarden.dae', tint: 0x34364e, description: 'A shadowy garden with a different atmosphere.' },
};
const ENTRANCES = [
  { id: 'NEUTRAL' as const, label: 'Neutral Garden', path: 'chao-garden-entrance/chao_garden_entrance.glb', x: -10 },
  { id: 'HERO' as const, label: 'Hero Garden', path: 'hero-garden-entrance/hero_garden_entrance.glb', x: -3.5 },
  { id: 'DARK' as const, label: 'Dark Garden', path: 'dark-garden-entrance/dark_garden_entrance.glb', x: 3.5 },
];

function fitModel(model: THREE.Object3D, targetWidth: number) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const largest = Math.max(size.x, size.z, size.y * 0.72, 0.001);
  model.scale.multiplyScalar(targetWidth / largest);
  model.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(model);
  const center = fitted.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= fitted.min.y;
  model.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        material.side = THREE.DoubleSide;
        const m = material as THREE.Material & { map?: THREE.Texture | null };
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        material.needsUpdate = true;
      });
    }
  });
  return model;
}

export default function AssetChaoHubPreview() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const worldGroupRef = useRef<THREE.Group | null>(null);
  const [world, setWorld] = useState<WorldId>('LOBBY');
  const [status, setStatus] = useState('Preparing the 3D scene…');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let alive = true;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbdddf5);
    scene.fog = new THREE.Fog(0xbdddf5, 65, 170);
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / Math.max(mount.clientHeight, 1), 0.1, 500);
    camera.position.set(0, 15, 39);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 4, 0);
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 7;
    controls.maxDistance = 100;
    const hemi = new THREE.HemisphereLight(0xffffff, 0x506078, 2.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 3.2);
    sun.position.set(-22, 35, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9bc8ff, 1.1);
    fill.position.set(24, 12, -20);
    scene.add(fill);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0x709c70, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    scene.add(ground);
    const group = new THREE.Group();
    scene.add(group);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    worldGroupRef.current = group;
    let frame = 0;
    const render = () => {
      if (!alive) return;
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();
    const resize = () => {
      camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', resize);
    setStatus('3D renderer ready');
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
    };
  }, []);

  useEffect(() => {
    const group = worldGroupRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!group || !scene || !camera || !controls) return;
    let cancelled = false;
    group.clear();
    setLoaded(false);
    setError('');
    const add = (model: THREE.Object3D) => {
      if (cancelled) return;
      group.add(model);
      setLoaded(true);
      setStatus('Environment loaded');
    };
    const addEntrance = async (path: string, x: number, targetSize: number) => {
      const gltf = await new GLTFLoader().loadAsync(ROOT + path);
      const model = fitModel(gltf.scene, targetSize);
      model.position.x += x;
      model.position.z += 11;
      model.userData.entrance = true;
      return model;
    };
    const loadObj = async (folder: string, file: string, mtl: string) => {
      const base = ROOT + folder;
      const materials = await new MTLLoader().setPath(base).loadAsync(mtl);
      materials.preload();
      return new OBJLoader().setMaterials(materials).setPath(base).loadAsync(file);
    };
    const load = async () => {
      try {
        setStatus(world === 'LOBBY' ? 'Loading the supplied Chao Lobby…' : 'Loading ' + WORLDS[world].title + '…');
        if (world === 'LOBBY') {
          const lobby = await loadObj('Chao%20Lobby/', 'Chao%20Lobby%20(Version%201).obj', 'Chao%20Lobby%20(Version%201).mtl');
          if (cancelled) return;
          add(fitModel(lobby, 43));
          setStatus('Loading garden entrances…');
          const doors = await Promise.all(ENTRANCES.map((e) => addEntrance(e.path, e.x, 4.6)));
          if (cancelled) return;
          doors.forEach((door) => group.add(door));
          const school = await addEntrance('chao-kindergarden-entrance/chao_kindergarden_entrance.glb', 13, 3.8);
          if (cancelled) return;
          school.position.z -= 18;
          group.add(school);
          camera.position.set(0, 15, 45);
          controls.target.set(0, 3.5, 0);
          scene.background = new THREE.Color(0xbdddf5);
          scene.fog = new THREE.Fog(0xbdddf5, 65, 170);
          setStatus('Lobby ready — select a garden entrance below');
        } else {
          const spec = WORLDS[world];
          let model: THREE.Object3D;
          if (spec.format === 'gltf') {
            model = (await new GLTFLoader().loadAsync(ROOT + spec.path)).scene;
          } else if (spec.format === 'obj') {
            model = await loadObj(spec.folder, spec.file, spec.mtl!);
          } else {
            const collada = await new ColladaLoader().setPath(ROOT + spec.folder).loadAsync(spec.file);
            model = collada.scene;
          }
          if (cancelled) return;
          add(fitModel(model, 42));
          const color = new THREE.Color(spec.tint);
          scene.background = color;
          scene.fog = new THREE.Fog(color, 70, 180);
          camera.position.set(0, 17, 43);
          controls.target.set(0, 4, 0);
          setStatus(spec.title + ' loaded');
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Unknown asset loading error';
          setError(message);
          setStatus('Asset failed to load — see details below');
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [world]);

  const go = (next: WorldId) => {
    setWorld(next);
    if (next === 'LOBBY') {
      const scene = sceneRef.current;
      if (scene) {
        scene.background = new THREE.Color(0xbdddf5);
        scene.fog = new THREE.Fog(0xbdddf5, 65, 170);
      }
    }
  };
  const title = world === 'LOBBY' ? 'Chao Lobby' : WORLDS[world].title;
  const description = world === 'LOBBY' ? 'The central hub. Choose a garden entrance, then return here whenever you want.' : WORLDS[world].description;

  return (
    <main style={{ minHeight: '100vh', background: '#f5f7fb', color: '#101828', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px clamp(16px, 4vw, 54px)', background: 'rgba(255,255,255,.9)', borderBottom: '1px solid #e4e7ec', position: 'relative', zIndex: 2 }}>
        <div><div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 800, color: '#667085' }}>PROJECT SOLANDER · ASSET PREVIEW</div><div style={{ fontSize: 22, fontWeight: 850, letterSpacing: -0.7 }}>Chao World <span style={{ color: '#3983f6' }}>Hub</span></div></div>
        <a href="/" style={{ color: '#344054', textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '10px 14px', border: '1px solid #d0d5dd', borderRadius: 12 }}>Back to game ↗</a>
      </header>
      <section style={{ maxWidth: 1500, margin: '0 auto', padding: '24px clamp(14px, 3vw, 42px) 42px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
          <div><div style={{ fontSize: 12, fontWeight: 800, color: '#667085', letterSpacing: 1.5, textTransform: 'uppercase' }}>{world === 'LOBBY' ? 'Central hub' : 'Garden environment'}</div><h1 style={{ fontSize: 'clamp(30px, 4vw, 48px)', letterSpacing: -1.7, lineHeight: 1.02, margin: '8px 0 10px' }}>{title}</h1><p style={{ color: '#667085', margin: 0, maxWidth: 650, lineHeight: 1.6 }}>{description}</p></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: loaded ? '#067647' : '#475467', background: '#fff', border: '1px solid #e4e7ec', padding: '10px 13px', borderRadius: 999, fontSize: 12, fontWeight: 750 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: loaded ? '#12b76a' : '#f79009' }} />{status}</div>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, background: '#d7e6f6', border: '1px solid #d0d5dd', boxShadow: '0 20px 60px rgba(16,24,40,.12)' }}>
          <div ref={mountRef} style={{ height: 'min(66vh, 700px)', minHeight: 390, width: '100%', cursor: 'grab' }} />
          <div style={{ position: 'absolute', left: 16, bottom: 16, padding: '9px 12px', borderRadius: 12, background: 'rgba(16,24,40,.78)', color: '#fff', fontSize: 12, pointerEvents: 'none' }}>Drag to orbit · Scroll to zoom</div>
          {error && <div style={{ position: 'absolute', left: 16, right: 16, top: 16, background: '#fff1f0', color: '#b42318', border: '1px solid #fecdca', borderRadius: 12, padding: 14, fontSize: 13 }}>Could not load this asset: {error}. Try opening the preview in a new tab or check GitHub raw asset access.</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '22px 0 12px' }}>
          <h2 style={{ margin: 0, fontSize: 19, letterSpacing: -.4 }}>{world === 'LOBBY' ? 'Choose an entrance' : 'Explore the hub'}</h2>
          {world !== 'LOBBY' && <button onClick={() => go('LOBBY')} style={{ cursor: 'pointer', border: 0, background: '#101828', color: '#fff', padding: '12px 17px', borderRadius: 12, fontWeight: 800 }}>← Return to Lobby</button>}
        </div>
        {world === 'LOBBY' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 14 }}>
            {([
              { id: 'NEUTRAL' as const, tag: 'START HERE', color: '#4b8df8', text: 'The everyday Chao garden.' },
              { id: 'HERO' as const, tag: 'HERO ALIGNMENT', color: '#12a76b', text: 'A bright, peaceful garden.' },
              { id: 'DARK' as const, tag: 'DARK ALIGNMENT', color: '#7a5af8', text: 'A moody garden environment.' },
            ]).map((item) => <button key={item.id} onClick={() => go(item.id)} style={{ textAlign: 'left', cursor: 'pointer', padding: 20, borderRadius: 18, border: '1px solid #e4e7ec', background: '#fff', boxShadow: '0 5px 18px rgba(16,24,40,.04)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><span style={{ color: item.color, fontSize: 11, fontWeight: 850, letterSpacing: 1 }}>{item.tag}</span><span style={{ color: item.color, fontSize: 22 }}>↗</span></div><div style={{ fontSize: 21, fontWeight: 850, margin: '12px 0 5px' }}>{WORLDS[item.id].title}</div><div style={{ fontSize: 13, color: '#667085', lineHeight: 1.5 }}>{item.text}</div></button>)}
          </div>
        ) : (
          <div style={{ border: '1px solid #e4e7ec', background: '#fff', borderRadius: 18, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div><div style={{ fontWeight: 850 }}>You're visiting {title}</div><div style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>The environment model is loaded from the labelled assets in the repository.</div></div>
            <button onClick={() => go('LOBBY')} style={{ cursor: 'pointer', border: '1px solid #d0d5dd', background: '#fff', color: '#344054', padding: '11px 15px', borderRadius: 12, fontWeight: 800 }}>Back to all gardens</button>
          </div>
        )}
        <p style={{ fontSize: 12, color: '#98a2b3', marginTop: 20 }}>Prototype viewer for validating the supplied static environment assets. This is not yet the final in-game player/collision implementation.</p>
      </section>
    </main>
  );
}
