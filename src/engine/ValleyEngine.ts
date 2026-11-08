import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { audioStore } from './audioEngine';

export interface ValleyEngineCallbacks {
  onLoaded?: () => void;
  onIntroDone?: () => void;
  onProgressChange?: (normalizedProgress: number, speed: number) => void;
}

/**
 * Terrain height function for the Night Flower & Golden Grain Valley.
 * Creates a winding central valley floor flanked by terraced agricultural ridges.
 */
export function valleyGroundHeightAt(x: number, z: number): number {
  const meander = Math.sin(z * 0.032) * 14.0 + Math.cos(z * 0.015) * 8.0;
  const distFromCenter = Math.abs(x - meander);
  const valleyWall = Math.pow(Math.max(0, distFromCenter - 4.5) * 0.085, 1.65) * 16.0;
  const rollingHills =
    Math.sin(x * 0.09 + z * 0.06) * 1.45 +
    Math.cos(x * 0.045 - z * 0.08) * 1.9 +
    Math.sin(x * 0.22 + z * 0.19) * 0.45;
  // Subtle agricultural terrace steps on the hillsides
  const terrace = Math.sin(valleyWall * 1.8) * 0.28;
  return valleyWall + rollingHills + terrace - 3.2;
}

export class ValleyEngine {
  private container: HTMLElement;
  private canvasContainer: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;

  private cameraCurve: THREE.CatmullRomCurve3;
  private scrollTarget = 0;
  private scrollCurrent = 0;
  private scrollSpeed = 0;
  private autoDriftSpeed = 0.014;

  private hoverTarget = 0;
  private hoverCurrent = 0;

  private mouseNDC = new THREE.Vector2(0, 0);
  private smoothedMouseNDC = new THREE.Vector2(0, 0);

  private vitalityTarget = 1.0;
  private vitalityCurrent = 1.0;

  private flowerPrimaryColor = new THREE.Color('#f5efe2');
  private flowerSecondaryColor = new THREE.Color('#e8b85c');
  private targetPrimaryColor = new THREE.Color('#f5efe2');
  private targetSecondaryColor = new THREE.Color('#e8b85c');
  private fogColor = new THREE.Color('#050608');
  private targetFogColor = new THREE.Color('#050608');

  private flowerMaterial!: THREE.ShaderMaterial;
  private leafMaterial!: THREE.ShaderMaterial;
  private dustMaterial!: THREE.ShaderMaterial;
  private terrainMaterial!: THREE.ShaderMaterial;
  private lightRaySprites: THREE.Sprite[] = [];
  private landmarkGroups: THREE.Group[] = [];

  private lastFrameTime = 0;
  private elapsedTime = 0;
  private introDuration = 0.55;
  private introFinished = false;

  private frameId = 0;
  private isDisposed = false;
  private touchStartY = 0;

  private onLoaded?: () => void;
  private onIntroDone?: () => void;
  private onProgressChange?: (normalizedProgress: number, speed: number) => void;

  // Pre-allocated scratch math vectors (zero GC in render loop)
  private readonly _camPos = new THREE.Vector3();
  private readonly _lookAtPos = new THREE.Vector3();
  private readonly _tangent = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _up = new THREE.Vector3(0, 1, 0);

  constructor(
    rootEl: HTMLElement,
    onLoaded?: () => void,
    onIntroDone?: () => void,
    onProgressChange?: (normalizedProgress: number, speed: number) => void
  ) {
    this.container = rootEl;
    this.canvasContainer =
      (rootEl.querySelector('.js-canvas-container') as HTMLElement) || rootEl;
    this.onLoaded = onLoaded;
    this.onIntroDone = onIntroDone;
    this.onProgressChange = onProgressChange;

    // 1. Detect software WebGL (SwiftShader / llvmpipe) from renderer string
    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Check ?autostart=1 for instant intro completion
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      this.introDuration = 0.05;
    }

    // 2. Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(this.fogColor, 1);

    this.canvasContainer.innerHTML = '';
    this.canvasContainer.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = this.fogColor;
    this.scene.fog = new THREE.FogExp2(this.fogColor.getHex(), 0.0115);

    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.5,
      240
    );

    // Studio environment map for metallic/glass landmark accents
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // 4. Build Camera Spline Path (camera-path07 equivalent)
    this.cameraCurve = this.createCameraPath();

    // 5. Build Lighting, Terrain, Flowers, Leaves, Landmarks, Light Rays & Dust
    this.setupLighting();
    this.buildValleyTerrain();
    this.buildPointSpriteFlowersAndLeaves();
    this.buildValleyLandmarks();
    this.buildLightRaysAndDust();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 6. Bind Interaction Listeners
    this.bindEvents();

    // 7. Notify Loaded & Start Render Loop
    window.setTimeout(() => {
      if (!this.isDisposed) {
        this.onLoaded?.();
      }
    }, 120);

    this.lastFrameTime = performance.now();
    this.tick();
  }

  private createCameraPath(): THREE.CatmullRomCurve3 {
    const waypoints: THREE.Vector3[] = [];
    const numPoints = 24;
    const loopLength = 260;

    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const angle = t * Math.PI * 2;
      // Elliptical winding valley loop so the flight is seamless and continuous
      const z = -Math.sin(angle) * (loopLength * 0.46);
      const baseMeander = Math.sin(z * 0.032) * 14.0 + Math.cos(z * 0.015) * 8.0;
      const lateralLoop = (1 - Math.cos(angle)) * 18.0 - 18.0;
      const x = baseMeander * 0.65 + lateralLoop * 0.35;
      const groundY = valleyGroundHeightAt(x, z);
      const y = groundY + 4.4 + Math.sin(angle * 3) * 0.85;
      waypoints.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(waypoints, true, 'catmullrom', 0.5);
  }

  private setupLighting(): void {
    // Warm golden harvest moonlight directional key light
    const keyLight = new THREE.DirectionalLight(0xf7dfb0, 2.2);
    keyLight.position.set(28, 55, -24);
    this.scene.add(keyLight);

    // Cool night sky / deep earth hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0x283c66, 0x120e08, 1.35);
    this.scene.add(hemiLight);

    // Subtle rim light from the valley horizon
    const rimLight = new THREE.DirectionalLight(0xd99b4e, 1.1);
    rimLight.position.set(-30, 18, 45);
    this.scene.add(rimLight);
  }

  private buildValleyTerrain(): void {
    const width = 220;
    const depth = 300;
    const segX = 128;
    const segZ = 160;

    const geom = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geom.rotateX(-Math.PI / 2);

    const posAttr = geom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = valleyGroundHeightAt(vx, vz);
      posAttr.setY(i, vy);
    }
    geom.computeVertexNormals();

    this.terrainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFogColor: { value: this.fogColor },
        uPrimaryColor: { value: this.flowerPrimaryColor },
        uSecondaryColor: { value: this.flowerSecondaryColor },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vViewDist;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xyz;
          vec4 mvPosition = viewMatrix * worldPosition;
          vViewDist = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uFogColor;
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vViewDist;

        void main() {
          vec3 baseSoil = vec3(0.025, 0.032, 0.028);
          vec3 ridgeTint = vec3(0.055, 0.052, 0.042);
          float heightFactor = smoothstep(-4.0, 14.0, vWorldPos.y);
          vec3 col = mix(baseSoil, ridgeTint, heightFactor);

          // Subtle topographic terrace luminescence lines along the valley slopes
          float contour = abs(fract(vWorldPos.y * 0.85) - 0.5);
          float contourLine = smoothstep(0.045, 0.0, contour) * 0.14 * heightFactor;
          col += uSecondaryColor * contourLine;

          // Soft moonlight grazing highlight
          vec3 lightDir = normalize(vec3(0.4, 0.8, -0.3));
          float diff = max(0.0, dot(vNormal, lightDir));
          col += uPrimaryColor * diff * 0.05;

          // Exponential depth fog matching scene
          float fogFactor = 1.0 - exp(-0.00018 * vViewDist * vViewDist);
          col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const terrainMesh = new THREE.Mesh(geom, this.terrainMaterial);
    this.scene.add(terrainMesh);
  }

  private buildPointSpriteFlowersAndLeaves(): void {
    // 1. Flowers & Golden Grain Blooms (15,000 points across the valley)
    const flowerCount = 15000;
    const flowerPositions = new Float32Array(flowerCount * 3);
    const flowerSeeds = new Float32Array(flowerCount * 4); // x: random scale, y: phase, z: colorMix, w: speciesType

    for (let i = 0; i < flowerCount; i++) {
      // Concentrate along the winding valley and lower slopes
      const z = (Math.random() - 0.5) * 265;
      const meander = Math.sin(z * 0.032) * 14.0 + Math.cos(z * 0.015) * 8.0;
      const spread = (Math.random() - 0.5) * 2;
      const signedSpread = Math.sign(spread) * Math.pow(Math.abs(spread), 1.25) * 58;
      const x = meander + signedSpread;
      const y = valleyGroundHeightAt(x, z) + 0.18 + Math.random() * 0.55;

      flowerPositions[i * 3] = x;
      flowerPositions[i * 3 + 1] = y;
      flowerPositions[i * 3 + 2] = z;

      flowerSeeds[i * 4] = 0.65 + Math.random() * 0.85;
      flowerSeeds[i * 4 + 1] = Math.random() * Math.PI * 2;
      flowerSeeds[i * 4 + 2] = Math.random();
      flowerSeeds[i * 4 + 3] = Math.random() > 0.35 ? 1.0 : 0.0; // 1 = 5-petal night flower, 0 = glowing wheat ear bloom
    }

    const flowerGeom = new THREE.BufferGeometry();
    flowerGeom.setAttribute('position', new THREE.BufferAttribute(flowerPositions, 3));
    flowerGeom.setAttribute('aSeed', new THREE.BufferAttribute(flowerSeeds, 4));

    this.flowerMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouseNDC: { value: new THREE.Vector2(0, 0) },
        uHoverDispersion: { value: 0 },
        uVitality: { value: 1.0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uPrimaryColor: { value: this.flowerPrimaryColor },
        uSecondaryColor: { value: this.flowerSecondaryColor },
        uFogColor: { value: this.fogColor },
      },
      vertexShader: `
        attribute vec4 aSeed;

        uniform float uTime;
        uniform vec2 uMouseNDC;
        uniform float uHoverDispersion;
        uniform float uVitality;
        uniform float uPixelRatio;

        varying float vBloom;
        varying float vCursorGlow;
        varying float vFogFactor;
        varying vec4 vSeed;

        void main() {
          vSeed = aSeed;
          vec3 pos = position;

          // Gentle night wind sway
          float sway = sin(uTime * 1.4 + pos.x * 0.25 + pos.z * 0.2 + aSeed.y) * 0.18;
          pos.x += sway;
          pos.z += cos(uTime * 1.1 + pos.z * 0.15 + aSeed.y) * 0.12;

          // Hover transition: disperse flowers outward and upward into floating glowing particles
          if (uHoverDispersion > 0.001) {
            float angle = aSeed.y * 2.0 + uTime * 0.45;
            vec3 disperseOffset = vec3(
              cos(angle) * (2.8 + aSeed.x * 3.5),
              1.8 + fract(aSeed.y) * 5.2 + sin(uTime * 1.2 + aSeed.y) * 0.8,
              sin(angle) * (2.8 + aSeed.z * 3.5)
            );
            pos += disperseOffset * uHoverDispersion;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float distToCam = -mvPosition.z;

          // Flowers bloom from small buds in the distance to full size as they approach the camera
          float bloomApproach = smoothstep(78.0, 14.0, distToCam);
          vBloom = bloomApproach;

          vec4 clipPos = projectionMatrix * mvPosition;
          vec2 ndc = clipPos.xy / max(0.0001, clipPos.w);

          // Screen-space mouse repulsion & proximity glow
          vec2 deltaNDC = ndc - uMouseNDC;
          deltaNDC.x *= 1.6; // aspect compensation
          float distSq = dot(deltaNDC, deltaNDC);
          float pushStrength = exp(-distSq * 11.0);
          vec2 pushDir = length(deltaNDC) > 0.0001 ? normalize(deltaNDC) : vec2(0.0, 1.0);

          // Push points away from cursor in screen space
          clipPos.xy += pushDir * pushStrength * 0.085 * clipPos.w;
          vCursorGlow = pushStrength;

          gl_Position = clipPos;

          // Point size scales with bloom, vitality, and perspective depth
          float baseSize = (18.0 + aSeed.x * 22.0) * (0.28 + 0.72 * bloomApproach) * uVitality;
          baseSize *= (1.0 + pushStrength * 0.55 + uHoverDispersion * 0.25);
          gl_PointSize = clamp(baseSize * uPixelRatio * (12.0 / max(2.5, distToCam)), 1.5, 64.0);

          vFogFactor = clamp(1.0 - exp(-0.00022 * distToCam * distToCam), 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;
        uniform vec3 uFogColor;
        uniform float uHoverDispersion;

        varying float vBloom;
        varying float vCursorGlow;
        varying float vFogFactor;
        varying vec4 vSeed;

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float r = length(uv);
          if (r > 1.0) discard;

          // Rotate petal coordinates per flower seed
          float angle = atan(uv.y, uv.x) + vSeed.y;
          // 5-petal night flower vs golden grain spikelet silhouette
          float petalMod = vSeed.w > 0.5
            ? 0.72 + 0.28 * cos(angle * 5.0)
            : 0.68 + 0.32 * cos(angle * 2.0);

          float shapedR = r / mix(1.0, petalMod, vBloom * (1.0 - uHoverDispersion * 0.7));
          if (shapedR > 1.0) discard;

          float core = exp(-shapedR * shapedR * 5.5);
          float halo = smoothstep(1.0, 0.15, shapedR) * 0.65;
          float alpha = (core + halo) * (0.25 + 0.75 * vBloom) * (1.0 - vFogFactor * 0.92);

          vec3 flowerCol = mix(uSecondaryColor, uPrimaryColor, vSeed.z * 0.7 + core * 0.3);
          // Points nearest the cursor glow warm cream-gold
          vec3 glowTint = vec3(1.0, 0.96, 0.86);
          flowerCol = mix(flowerCol, glowTint, clamp(vCursorGlow * 0.75 + core * 0.35, 0.0, 1.0));

          gl_FragColor = vec4(flowerCol, alpha);
        }
      `,
    });

    const flowerPoints = new THREE.Points(flowerGeom, this.flowerMaterial);
    flowerPoints.frustumCulled = false;
    this.scene.add(flowerPoints);

    // 2. Valley Leaves & Botanical Ground Cover (8,500 points growing in further back)
    const leafCount = 8500;
    const leafPositions = new Float32Array(leafCount * 3);
    const leafSeeds = new Float32Array(leafCount * 3);

    for (let i = 0; i < leafCount; i++) {
      const z = (Math.random() - 0.5) * 270;
      const meander = Math.sin(z * 0.032) * 14.0 + Math.cos(z * 0.015) * 8.0;
      const x = meander + (Math.random() - 0.5) * 115;
      const y = valleyGroundHeightAt(x, z) + 0.08 + Math.random() * 0.22;

      leafPositions[i * 3] = x;
      leafPositions[i * 3 + 1] = y;
      leafPositions[i * 3 + 2] = z;

      leafSeeds[i * 3] = 0.6 + Math.random() * 0.9;
      leafSeeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      leafSeeds[i * 3 + 2] = Math.random();
    }

    const leafGeom = new THREE.BufferGeometry();
    leafGeom.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
    leafGeom.setAttribute('aSeed', new THREE.BufferAttribute(leafSeeds, 3));

    this.leafMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouseNDC: { value: new THREE.Vector2(0, 0) },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uSecondaryColor: { value: this.flowerSecondaryColor },
      },
      vertexShader: `
        attribute vec3 aSeed;
        uniform float uTime;
        uniform vec2 uMouseNDC;
        uniform float uPixelRatio;

        varying float vAlpha;
        varying float vTint;

        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * 0.9 + aSeed.y) * 0.1;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPosition.z;

          // Leaves grow in further back in the valley
          float leafGrowth = smoothstep(115.0, 28.0, dist);
          vec4 clipPos = projectionMatrix * mvPosition;
          vec2 ndc = clipPos.xy / max(0.0001, clipPos.w);
          vec2 delta = (ndc - uMouseNDC) * vec2(1.6, 1.0);
          float push = exp(-dot(delta, delta) * 12.0);
          clipPos.xy += normalize(delta + vec2(0.0001)) * push * 0.04 * clipPos.w;

          gl_Position = clipPos;
          gl_PointSize = clamp((11.0 + aSeed.x * 12.0) * leafGrowth * uPixelRatio * (10.0 / max(3.0, dist)), 1.0, 28.0);
          float fog = clamp(1.0 - exp(-0.0002 * dist * dist), 0.0, 1.0);
          vAlpha = leafGrowth * (1.0 - fog) * 0.52;
          vTint = aSeed.z;
        }
      `,
      fragmentShader: `
        uniform vec3 uSecondaryColor;
        varying float vAlpha;
        varying float vTint;

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float d = length(uv);
          if (d > 1.0) discard;
          float soft = smoothstep(1.0, 0.1, d);
          vec3 leafGreen = mix(vec3(0.11, 0.28, 0.22), uSecondaryColor * 0.65, vTint * 0.5);
          gl_FragColor = vec4(leafGreen, soft * vAlpha);
        }
      `,
    });

    const leafPoints = new THREE.Points(leafGeom, this.leafMaterial);
    leafPoints.frustumCulled = false;
    this.scene.add(leafPoints);
  }

  /**
   * Builds 5 grounded, multi-part procedural 3D architectural/botanical landmarks
   * along the valley path representing the 5 stations of the Food Scarcity journey.
   */
  private buildValleyLandmarks(): void {
    const stations = [0.06, 0.22, 0.42, 0.66, 0.86];

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2a2621,
      roughness: 0.82,
      metalness: 0.12,
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xc89d54,
      roughness: 0.28,
      metalness: 0.85,
    });
    const glowCoreMat = new THREE.MeshStandardMaterial({
      color: 0xf5efe2,
      emissive: 0xe8b85c,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    const darkTimberMat = new THREE.MeshStandardMaterial({
      color: 0x1a1612,
      roughness: 0.65,
      metalness: 0.2,
    });

    stations.forEach((t, idx) => {
      const pathPt = this.cameraCurve.getPointAt(t);
      const sideSign = idx % 2 === 0 ? 1 : -1;
      const lmX = pathPt.x + sideSign * 11.5;
      const lmZ = pathPt.z;
      const lmY = valleyGroundHeightAt(lmX, lmZ);

      const group = new THREE.Group();
      group.position.set(lmX, lmY, lmZ);

      // Contact shadow disc flush on the valley ground
      const shadowDisc = new THREE.Mesh(
        new THREE.CircleGeometry(4.2, 24),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        })
      );
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.03;
      group.add(shadowDisc);

      // Part 1: Stepped stone plinth base
      const plinthLower = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.1, 0.9, 8), stoneMat);
      plinthLower.position.y = 0.45;
      group.add(plinthLower);

      const plinthUpper = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.4, 0.7, 8), darkTimberMat);
      plinthUpper.position.y = 1.25;
      group.add(plinthUpper);

      // Part 2: Four fluted botanical sanctuary pillars
      for (let p = 0; p < 4; p++) {
        const angle = (p * Math.PI) / 2 + Math.PI / 4;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 5.2, 12), stoneMat);
        pillar.position.set(Math.cos(angle) * 1.35, 3.8, Math.sin(angle) * 1.35);
        group.add(pillar);
      }

      // Part 3: Lathe-sculpted Seed / Grain Vessel crown
      const lathePoints = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.65, 0.35),
        new THREE.Vector2(0.95, 1.1),
        new THREE.Vector2(0.55, 2.0),
        new THREE.Vector2(0.15, 2.6),
        new THREE.Vector2(0.0, 2.8),
      ];
      const seedVesselGeom = new THREE.LatheGeometry(lathePoints, 18);
      const seedVessel = new THREE.Mesh(seedVesselGeom, bronzeMat);
      seedVessel.position.y = 2.4;
      group.add(seedVessel);

      // Part 4: Luminous suspended grain core
      const coreBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 1), glowCoreMat);
      coreBeacon.position.y = 5.8;
      group.add(coreBeacon);

      // Part 5: Dual intersecting bronze solar/harvest rings
      const ringGeom = new THREE.TorusGeometry(1.55, 0.06, 12, 32);
      const ringA = new THREE.Mesh(ringGeom, bronzeMat);
      ringA.position.y = 5.8;
      ringA.rotation.x = Math.PI / 3;
      group.add(ringA);

      const ringB = new THREE.Mesh(ringGeom, bronzeMat);
      ringB.position.y = 5.8;
      ringB.rotation.y = Math.PI / 3;
      group.add(ringB);

      // Part 6: Arching canopy cap
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.4, 8), darkTimberMat);
      canopy.position.y = 7.1;
      group.add(canopy);

      this.scene.add(group);
      this.landmarkGroups.push(group);
    });
  }

  private buildLightRaysAndDust(): void {
    // 1. Procedural soft radial light ray texture on HTML5 canvas
    const rayCanvas = document.createElement('canvas');
    rayCanvas.width = 128;
    rayCanvas.height = 256;
    const ctx = rayCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(64, 0, 64, 256);
      grad.addColorStop(0.0, 'rgba(245, 239, 226, 0.0)');
      grad.addColorStop(0.3, 'rgba(245, 239, 226, 0.09)');
      grad.addColorStop(0.7, 'rgba(232, 184, 92, 0.04)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 256);
    }
    const rayTexture = new THREE.CanvasTexture(rayCanvas);
    rayTexture.colorSpace = THREE.SRGBColorSpace;

    for (let i = 0; i < 14; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: rayTexture,
        color: 0xf5efe2,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      const z = (i / 14 - 0.5) * 220;
      const meander = Math.sin(z * 0.032) * 14.0;
      const x = meander + (i % 2 === 0 ? -18 : 18);
      const y = valleyGroundHeightAt(x, z) + 14;
      sprite.position.set(x, y, z);
      sprite.scale.set(16, 38, 1);
      sprite.material.rotation = (i % 2 === 0 ? -1 : 1) * 0.28;
      this.scene.add(sprite);
      this.lightRaySprites.push(sprite);
    }

    // 2. Floating Atmospheric Pollen / Golden Spore Dust (1,800 particles)
    const dustCount = 1800;
    const dustPos = new Float32Array(dustCount * 3);
    const dustPhase = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      const z = (Math.random() - 0.5) * 240;
      const x = (Math.random() - 0.5) * 95;
      const y = valleyGroundHeightAt(x, z) + 1.2 + Math.random() * 14.0;
      dustPos[i * 3] = x;
      dustPos[i * 3 + 1] = y;
      dustPos[i * 3 + 2] = z;
      dustPhase[i] = Math.random() * Math.PI * 2;
    }

    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeom.setAttribute('aPhase', new THREE.BufferAttribute(dustPhase, 1));

    this.dustMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uPrimaryColor: { value: this.flowerPrimaryColor },
      },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.65 + aPhase) * 0.85;
          pos.x += cos(uTime * 0.45 + aPhase) * 0.55;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(8.5 * uPixelRatio * (10.0 / max(3.0, dist)), 1.0, 14.0);
          float pulse = 0.45 + 0.55 * sin(uTime * 1.8 + aPhase * 3.0);
          float fog = clamp(1.0 - exp(-0.00025 * dist * dist), 0.0, 1.0);
          vAlpha = pulse * (1.0 - fog) * 0.55;
        }
      `,
      fragmentShader: `
        uniform vec3 uPrimaryColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float r = length(uv);
          if (r > 1.0) discard;
          float glow = exp(-r * r * 4.0);
          gl_FragColor = vec4(uPrimaryColor, glow * vAlpha);
        }
      `,
    });

    const dustPoints = new THREE.Points(dustGeom, this.dustMaterial);
    dustPoints.frustumCulled = false;
    this.scene.add(dustPoints);
  }

  private onWheel = (e: WheelEvent): void => {
    this.scrollTarget += e.deltaY * 0.00018;
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      this.touchStartY = e.touches[0].clientY;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      const dy = this.touchStartY - e.touches[0].clientY;
      this.touchStartY = e.touches[0].clientY;
      // 20x touch multiplier as specified in the prompt
      this.scrollTarget += dy * 0.00018 * 20 * 0.12;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    const ny = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    this.mouseNDC.set(nx, ny);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 's' || e.key === 'w') {
      this.scrollTarget += 0.022;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      this.scrollTarget -= 0.022;
    }
  };

  private onResize = (): void => {
    if (this.isDisposed) return;
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private bindEvents(): void {
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
  }

  public startHoverTransition(): void {
    this.hoverTarget = 1.0;
    audioStore().setMuffled(true);
  }

  public stopHoverTransition(): void {
    this.hoverTarget = 0.0;
    audioStore().setMuffled(false);
  }

  public flyToProgress(targetProgress: number): void {
    const currentLoop = Math.floor(this.scrollTarget);
    const currentNorm = ((this.scrollTarget % 1) + 1) % 1;
    let delta = targetProgress - currentNorm;
    if (delta > 0.5) delta -= 1;
    if (delta < -0.5) delta += 1;
    this.scrollTarget = currentLoop + currentNorm + delta;
  }

  public setBiomePalette(primaryHex: string, secondaryHex: string, fogHex: string): void {
    this.targetPrimaryColor.set(primaryHex);
    this.targetSecondaryColor.set(secondaryHex);
    this.targetFogColor.set(fogHex);
  }

  public setVitalityMultiplier(score: number): void {
    this.vitalityTarget = Math.max(0.45, Math.min(1.75, score));
  }

  public getProgress(): number {
    return ((this.scrollCurrent % 1) + 1) % 1;
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext;
    if ('fenceSync' in gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private tick = (): void => {
    if (this.isDisposed) return;

    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;
    this.elapsedTime += dt;

    // Intro completion trigger
    if (this.elapsedTime >= this.introDuration) {
      if (!this.introFinished) {
        this.introFinished = true;
      }
      this.onIntroDone?.();
    }

    // Smooth hover transition damping
    this.hoverCurrent = THREE.MathUtils.damp(this.hoverCurrent, this.hoverTarget, 4.2, dt);

    // Idle forward drift along the valley path (eases to a stop during hover transition)
    const driftFactor = 1.0 - this.hoverCurrent * 0.92;
    this.scrollTarget += this.autoDriftSpeed * dt * driftFactor;

    const prevScroll = this.scrollCurrent;
    this.scrollCurrent = THREE.MathUtils.damp(this.scrollCurrent, this.scrollTarget, 4.5, dt);
    this.scrollSpeed = Math.abs(this.scrollCurrent - prevScroll) / Math.max(0.001, dt);

    // Smooth mouse NDC damping
    this.smoothedMouseNDC.x = THREE.MathUtils.damp(
      this.smoothedMouseNDC.x,
      this.mouseNDC.x,
      6.0,
      dt
    );
    this.smoothedMouseNDC.y = THREE.MathUtils.damp(
      this.smoothedMouseNDC.y,
      this.mouseNDC.y,
      6.0,
      dt
    );

    // Smooth vitality and biome color transitions
    this.vitalityCurrent = THREE.MathUtils.damp(this.vitalityCurrent, this.vitalityTarget, 3.5, dt);
    this.flowerPrimaryColor.lerp(this.targetPrimaryColor, 1 - Math.exp(-3.0 * dt));
    this.flowerSecondaryColor.lerp(this.targetSecondaryColor, 1 - Math.exp(-3.0 * dt));
    this.fogColor.lerp(this.targetFogColor, 1 - Math.exp(-2.5 * dt));
    this.renderer.setClearColor(this.fogColor, 1);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.fogColor);
    }

    // Evaluate camera position & look-ahead along CatmullRom spline
    const normT = ((this.scrollCurrent % 1) + 1) % 1;
    const lookAheadT = (normT + 0.028) % 1;

    this.cameraCurve.getPointAt(normT, this._camPos);
    this.cameraCurve.getPointAt(lookAheadT, this._lookAtPos);
    this.cameraCurve.getTangentAt(normT, this._tangent);

    // Intro glide from slightly higher altitude
    const introLerp = Math.min(1.0, this.elapsedTime / Math.max(0.01, this.introDuration));
    const introHeightOffset = (1.0 - introLerp) * 3.5;
    this._camPos.y += introHeightOffset;

    this.camera.position.copy(this._camPos);

    // Subtle camera tilt toward mouse cursor
    this._right.crossVectors(this._tangent, this._up).normalize();
    this._lookAtPos.addScaledVector(this._right, this.smoothedMouseNDC.x * 2.2);
    this._lookAtPos.y += this.smoothedMouseNDC.y * 1.45 - 0.5;
    this.camera.lookAt(this._lookAtPos);

    // Update shader uniforms
    this.flowerMaterial.uniforms.uTime.value = this.elapsedTime;
    this.flowerMaterial.uniforms.uMouseNDC.value.copy(this.smoothedMouseNDC);
    this.flowerMaterial.uniforms.uHoverDispersion.value = this.hoverCurrent;
    this.flowerMaterial.uniforms.uVitality.value = this.vitalityCurrent;

    this.leafMaterial.uniforms.uTime.value = this.elapsedTime;
    this.leafMaterial.uniforms.uMouseNDC.value.copy(this.smoothedMouseNDC);

    this.dustMaterial.uniforms.uTime.value = this.elapsedTime;
    this.terrainMaterial.uniforms.uTime.value = this.elapsedTime;

    // Rotate landmark rings gently
    for (let i = 0; i < this.landmarkGroups.length; i++) {
      const grp = this.landmarkGroups[i];
      const core = grp.children[8];
      const ringA = grp.children[9];
      const ringB = grp.children[10];
      if (core) core.rotation.y = this.elapsedTime * 0.8 + i;
      if (ringA) ringA.rotation.z = this.elapsedTime * 0.35 + i;
      if (ringB) ringB.rotation.x = this.elapsedTime * 0.28 + i;
    }

    this.onProgressChange?.(normT, this.scrollSpeed);

    // Render scene
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.isDisposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}

// Expose window.__GE as specified in the Fernhollow prompt
declare global {
  interface Window {
    __GE?: {
      et: () => typeof ValleyEngine;
      Y: () => typeof audioStore;
    };
    __valleyInstance?: ValleyEngine;
  }
}

if (typeof window !== 'undefined') {
  window.__GE = {
    et: () => ValleyEngine,
    Y: () => audioStore,
  };
}
