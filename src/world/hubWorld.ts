import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PortalCave } from './portals';

export class HubWorld {
  public sceneGroup: THREE.Group;
  public gardenPortal: PortalCave;
  public adventurePortal: PortalCave;

  // Collision and interactables
  public shopItems: THREE.Mesh[] = [];
  public lessonDesks: THREE.Group[] = [];

  constructor() {
    this.sceneGroup = new THREE.Group();

    // Ground Courtyard Platform
    const groundGeo = new THREE.CylinderGeometry(40, 42, 3, 32);
    const groundMat = new THREE.MeshToonMaterial({ color: 0x382f2d }); // Dark stone cobble
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    this.sceneGroup.add(ground);

    // Center Plaza Fountain
    const fountainGroup = new THREE.Group();
    const basinGeo = new THREE.CylinderGeometry(6, 6.5, 1.2, 24);
    const basinMat = new THREE.MeshToonMaterial({ color: 0x94a3b8 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 0.6;
    fountainGroup.add(basin);

    const waterGeo = new THREE.CylinderGeometry(5.6, 5.6, 0.2, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 1.1;
    fountainGroup.add(water);

    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.6, 3.5, 16);
    const pillar = new THREE.Mesh(pillarGeo, basinMat);
    pillar.position.y = 2.2;
    fountainGroup.add(pillar);

    this.sceneGroup.add(fountainGroup);

    // ==========================================
    // 1. CHAO BLACK MARKET / ITEM SHOP BUILDING
    // ==========================================
    const shopGroup = new THREE.Group();
    shopGroup.position.set(-18, 0, -12);

    // Building Wall
    const shopWallGeo = new THREE.BoxGeometry(12, 7, 10);
    const shopWallMat = new THREE.MeshToonMaterial({ color: 0xc2410c }); // Terracotta Orange
    const shopWall = new THREE.Mesh(shopWallGeo, shopWallMat);
    shopWall.position.y = 3.5;
    shopWall.castShadow = true;
    shopGroup.add(shopWall);

    // Roof
    const roofGeo = new THREE.ConeGeometry(9.5, 4, 4);
    const roofMat = new THREE.MeshToonMaterial({ color: 0x7c2d12 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 9;
    roof.rotation.y = Math.PI * 0.25;
    shopGroup.add(roof);

    // Shop Counter & Banner
    const counterGeo = new THREE.BoxGeometry(6, 1.2, 2);
    const counterMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.6, 5.2);
    shopGroup.add(counter);

    // Signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 64;
    const ctx1 = signCanvas.getContext('2d');
    if (ctx1) {
      ctx1.fillStyle = '#7c2d12';
      ctx1.fillRect(0, 0, 256, 64);
      ctx1.fillStyle = '#fde047';
      ctx1.font = 'bold 22px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.textBaseline = 'middle';
      ctx1.fillText('🛍️ CHAO ITEM SHOP', 128, 32);
    }
    const shopTex = new THREE.CanvasTexture(signCanvas);
    const shopSignGeo = new THREE.PlaneGeometry(5, 1.25);
    const shopSignMat = new THREE.MeshBasicMaterial({ map: shopTex });
    const shopSign = new THREE.Mesh(shopSignGeo, shopSignMat);
    shopSign.position.set(0, 6, 5.1);
    shopGroup.add(shopSign);

    this.sceneGroup.add(shopGroup);

    // ==========================================
    // 2. CHAO KINDERGARTEN & SCHOOL BUILDING
    // ==========================================
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(18, 0, -12);

    const schoolWallGeo = new THREE.BoxGeometry(14, 8, 11);
    const schoolWallMat = new THREE.MeshToonMaterial({ color: 0x0284c7 }); // Sky Blue
    const schoolWall = new THREE.Mesh(schoolWallGeo, schoolWallMat);
    schoolWall.position.y = 4;
    schoolWall.castShadow = true;
    schoolGroup.add(schoolWall);

    const schoolRoofGeo = new THREE.BoxGeometry(15.5, 1.5, 12.5);
    const schoolRoofMat = new THREE.MeshToonMaterial({ color: 0x075985 });
    const schoolRoof = new THREE.Mesh(schoolRoofGeo, schoolRoofMat);
    schoolRoof.position.y = 8.75;
    schoolGroup.add(schoolRoof);

    // Clock / Bell Tower
    const towerGeo = new THREE.BoxGeometry(3, 4, 3);
    const tower = new THREE.Mesh(towerGeo, schoolRoofMat);
    tower.position.set(0, 11, 0);
    schoolGroup.add(tower);

    // School Signboard
    const schoolCanvas = document.createElement('canvas');
    schoolCanvas.width = 256;
    schoolCanvas.height = 64;
    const ctx2 = schoolCanvas.getContext('2d');
    if (ctx2) {
      ctx2.fillStyle = '#0369a1';
      ctx2.fillRect(0, 0, 256, 64);
      ctx2.fillStyle = '#ffffff';
      ctx2.font = 'bold 20px sans-serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText('🏫 CHAO KINDERGARTEN', 128, 32);
    }
    const schoolTex = new THREE.CanvasTexture(schoolCanvas);
    const schoolSign = new THREE.Mesh(shopSignGeo, new THREE.MeshBasicMaterial({ map: schoolTex }));
    schoolSign.position.set(0, 6.5, 5.6);
    schoolGroup.add(schoolSign);

    this.sceneGroup.add(schoolGroup);

    // ==========================================
    // 3. CHAO KARATE & DOJO STADIUM BUILDING
    // ==========================================
    const dojoGroup = new THREE.Group();
    dojoGroup.position.set(0, 0, -22);

    const dojoWallGeo = new THREE.BoxGeometry(16, 9, 12);
    const dojoWallMat = new THREE.MeshToonMaterial({ color: 0xb91c1c }); // Crimson Dojo
    const dojoWall = new THREE.Mesh(dojoWallGeo, dojoWallMat);
    dojoWall.position.y = 4.5;
    dojoWall.castShadow = true;
    dojoGroup.add(dojoWall);

    // Pagoda Roof
    const pagodaRoofGeo = new THREE.ConeGeometry(12, 5, 4);
    const pagodaRoofMat = new THREE.MeshToonMaterial({ color: 0x450a0a });
    const pagodaRoof = new THREE.Mesh(pagodaRoofGeo, pagodaRoofMat);
    pagodaRoof.position.y = 11.5;
    pagodaRoof.rotation.y = Math.PI * 0.25;
    dojoGroup.add(pagodaRoof);

    // Dojo Sign
    const dojoCanvas = document.createElement('canvas');
    dojoCanvas.width = 256;
    dojoCanvas.height = 64;
    const ctx3 = dojoCanvas.getContext('2d');
    if (ctx3) {
      ctx3.fillStyle = '#450a0a';
      ctx3.fillRect(0, 0, 256, 64);
      ctx3.fillStyle = '#fef08a';
      ctx3.font = 'bold 22px sans-serif';
      ctx3.textAlign = 'center';
      ctx3.textBaseline = 'middle';
      ctx3.fillText('🥋 CHAO KARATE DOJO', 128, 32);
    }
    const dojoTex = new THREE.CanvasTexture(dojoCanvas);
    const dojoSign = new THREE.Mesh(shopSignGeo, new THREE.MeshBasicMaterial({ map: dojoTex }));
    dojoSign.position.set(0, 7.2, 6.1);
    dojoGroup.add(dojoSign);

    this.sceneGroup.add(dojoGroup);

    // ==========================================
    // PORTALS TO OTHER WORLDS
    // ==========================================
    this.gardenPortal = new PortalCave(new THREE.Vector3(-12, 0, 16), 'GARDEN');
    this.sceneGroup.add(this.gardenPortal.mesh);

    this.adventurePortal = new PortalCave(new THREE.Vector3(12, 0, 16), 'MYSTIC_VALLEY');
    this.sceneGroup.add(this.adventurePortal.mesh);
    this.loadClassicLobbyAsset();
  }

  public update(time: number, deltaTime: number = 0.016) {
    this.gardenPortal.update(time);
    this.adventurePortal.update(time);
  }

  /** Load the classic lobby as a replaceable visual layer; keep gameplay systems separate. */
  private async loadClassicLobbyAsset(): Promise<void> {
    const base = 'https://raw.githubusercontent.com/nagavisionltd/solander-demo/main/sa2b_assets/chao_garden_assets/Chao%20Lobby/';
    try {
      const materials = await new MTLLoader().setPath(base).loadAsync('Chao%20Lobby%20(Version%201).mtl');
      materials.preload();
      const model = await new OBJLoader().setMaterials(materials).setPath(base).loadAsync('Chao%20Lobby%20(Version%201).obj');

      // The exported model is approximately 120 x 71 x 114 units. Scale it to fit
      // the current hub, then ground it by its measured bounds rather than assuming
      // the source file's origin is at floor level.
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const targetWidth = 60;
      const scale = targetWidth / Math.max(size.x, size.z);
      model.scale.setScalar(scale);
      model.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(model);
      const center = fitted.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= fitted.min.y;

      // Keep portal meshes available to the existing world-transition system.
      for (const child of [...this.sceneGroup.children]) {
        if (child !== this.gardenPortal?.mesh && child !== this.adventurePortal?.mesh) {
          child.visible = false;
        }
      }
      model.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => {
            material.side = THREE.DoubleSide;
            const mapped = material as THREE.Material & { map?: THREE.Texture | null };
            if (mapped.map) mapped.map.colorSpace = THREE.SRGBColorSpace;
            material.needsUpdate = true;
          });
        }
      });
      model.name = 'classic-chao-lobby-asset';
      model.userData.assetSource = 'sa2b_assets/chao_garden_assets/Chao Lobby';
      this.sceneGroup.add(model);
    } catch (error) {
      // Keep the procedural hub as a reliable fallback if an asset or texture fails.
      console.warn('[Solander] Classic lobby asset failed to load; using procedural hub.', error);
    }
  }
}
