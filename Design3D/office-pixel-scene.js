/* office-pixel-scene.js — 3D rotatable room with pixel-art sprite characters that walk.
   <office-pixel-scene> custom element. Bus (window events):
     IN  'office:update' {agents:[{id,status,task,...}]}
     IN  'office:focus'  {id}
     OUT 'office:select' {id}
     OUT 'office:ready'  {}
   Characters are billboard sprites (pixel canvas textures) that wander when idle and walk to
   their desk when working. Room/desks are real 3D geometry; OrbitControls lets you rotate. */
(function () {
  const AGENTS = [
    { id:'main',     name:'Main',     color:'#2ee08a', skin:'#f2c79a', hair:'#3a2a1a', desk:[0,-7],   work:[0,-4.4] },
    { id:'research', name:'Research', color:'#9b8cff', skin:'#e8b483', hair:'#1d1d24', desk:[-9,-2.5], work:[-6.3,-2.5] },
    { id:'comms',    name:'Comms',    color:'#46c6ff', skin:'#f2c79a', hair:'#2a1c12', desk:[9,-2.5],  work:[6.3,-2.5] },
    { id:'content',  name:'Content',  color:'#ff5fa8', skin:'#e8b483', hair:'#0f0f14', desk:[-7,6],    work:[-4.8,4.2] },
    { id:'ops',      name:'Ops',      color:'#f7b32b', skin:'#f2c79a', hair:'#23364a', desk:[7,6],     work:[4.8,4.2] },
  ];
  const WANDER = { x0:-4.5, x1:4.5, z0:0, z1:5.5 };

  const waitForTHREE = () => new Promise((res) => { const t = () => (window.THREE ? res(window.THREE) : setTimeout(t, 30)); t(); });

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // ---- pixel character drawn onto an 18x24 canvas (feet at bottom-center) ----
  function drawPixelChar(a, frame) {
    const c = document.createElement('canvas'); c.width = 18; c.height = 24;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const P = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); };
    const cx = 9, top = 1;
    const sh = a.color, sk = a.skin, hr = a.hair, pant = '#2a2f3d';
    // legs
    if (frame === 1) { P(cx-3, top+15, 3, 7, pant); P(cx, top+16, 3, 6, pant); }
    else if (frame === 2) { P(cx-3, top+16, 3, 6, pant); P(cx, top+15, 3, 7, pant); }
    else { P(cx-3, top+16, 3, 6, pant); P(cx, top+16, 3, 6, pant); }
    // body + arms
    P(cx-5, top+9, 10, 8, sh);
    P(cx-6, top+9, 2, 6, sh); P(cx+5, top+9, 2, 6, sh);
    // head
    P(cx-4, top+2, 8, 8, sk);
    // hair
    P(cx-4, top+1, 8, 3, hr); P(cx-5, top+2, 1, 3, hr); P(cx+4, top+2, 1, 3, hr);
    // eyes
    P(cx-2, top+5, 1, 2, '#1a1a26'); P(cx+1, top+5, 1, 2, '#1a1a26');
    return c;
  }

  class OfficePixelScene extends HTMLElement {
    connectedCallback() {
      if (this._booted) return; this._booted = true;
      this.style.display = 'block'; this.style.position = 'relative';
      this.style.width = this.style.width || '100%'; this.style.height = this.style.height || '100%';
      this._status = {}; this._init();
    }
    disconnectedCallback() {
      this._alive = false; clearInterval(this._raf);
      window.removeEventListener('office:update', this._onUpdate);
      window.removeEventListener('office:focus', this._onFocus);
      if (this._ro) this._ro.disconnect();
      if (this._renderer) { this._renderer.dispose(); this._renderer.domElement.remove(); }
    }

    async _init() {
      const THREE = await waitForTHREE();
      try { await (document.fonts && document.fonts.ready); } catch (e) {}
      if (!this.isConnected) return; this._alive = true;

      const W = this.clientWidth || 800, H = this.clientHeight || 600;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.domElement.style.cssText = 'display:block;';
      this.appendChild(renderer.domElement); this._renderer = renderer; this._THREE = THREE;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0a0f17, 30, 60); this._scene = scene;

      const aspect = W / H; const D = 11;
      const cam = new THREE.OrthographicCamera(-D*aspect, D*aspect, D, -D, -60, 120);
      cam.position.set(15, 13, 15); cam.lookAt(0, 1.4, 0);
      this._cam = cam; this._D = D;

      let controls = null;
      if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(cam, renderer.domElement);
        controls.target.set(0, 1.4, 0); controls.enableDamping = true; controls.dampingFactor = 0.08;
        controls.enablePan = false; controls.minZoom = 0.7; controls.maxZoom = 2.4;
        controls.minPolarAngle = 0.5; controls.maxPolarAngle = 1.18; controls.update();
      }
      this._controls = controls;

      scene.add(new THREE.AmbientLight(0xb6c6e0, 0.7));
      const key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(8, 16, 10); scene.add(key);
      const fill = new THREE.DirectionalLight(0x4a6bd0, 0.3); fill.position.set(-10, 6, -8); scene.add(fill);

      this._buildRoom(THREE, scene);

      // characters
      this._chars = {}; this._clickable = [];
      AGENTS.forEach((a) => this._buildChar(THREE, scene, a));

      // interaction
      this._ray = new THREE.Raycaster(); this._ndc = new THREE.Vector2();
      const dom = renderer.domElement; let down = null;
      dom.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
      dom.addEventListener('pointerup', (e) => {
        if (!down) return; const moved = Math.hypot(e.clientX-down[0], e.clientY-down[1]); down = null;
        if (moved > 6) return; const id = this._pick(e);
        if (id) window.dispatchEvent(new CustomEvent('office:select', { detail:{ id } }));
      });
      dom.addEventListener('pointermove', (e) => { dom.style.cursor = this._pick(e) ? 'pointer' : 'grab'; });

      this._onUpdate = (e) => this._apply((e.detail && e.detail.agents) || []);
      this._onFocus = (e) => this._focus(e.detail && e.detail.id);
      window.addEventListener('office:update', this._onUpdate);
      window.addEventListener('office:focus', this._onFocus);

      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      window.dispatchEvent(new CustomEvent('office:ready', {}));

      this._t0 = performance.now(); this._last = this._t0;
      this._raf = setInterval(() => { try { this._frame(performance.now()); } catch (err) { console.error('pixel3d frame', err); } }, 33);
    }

    _resize() {
      if (!this._renderer) return; const W = this.clientWidth, H = this.clientHeight; if (!W || !H) return;
      this._renderer.setSize(W, H); const aspect = W / H;
      this._cam.left = -this._D*aspect; this._cam.right = this._D*aspect; this._cam.top = this._D; this._cam.bottom = -this._D;
      this._cam.updateProjectionMatrix();
    }

    _pick(e) {
      const r = this._renderer.domElement.getBoundingClientRect();
      this._ndc.x = ((e.clientX-r.left)/r.width)*2-1; this._ndc.y = -((e.clientY-r.top)/r.height)*2+1;
      this._ray.setFromCamera(this._ndc, this._cam);
      const hits = this._ray.intersectObjects(this._clickable, false);
      return hits.length ? hits[0].object.userData.agentId : null;
    }

    // ---------- room ----------
    _buildRoom(THREE, scene) {
      // pixel floor tile texture
      const fc = document.createElement('canvas'); fc.width = 32; fc.height = 32;
      const fx = fc.getContext('2d');
      fx.fillStyle = '#8a7860'; fx.fillRect(0,0,32,32);
      fx.fillStyle = '#80705a'; fx.fillRect(0,0,16,16); fx.fillRect(16,16,16,16);
      fx.fillStyle = 'rgba(0,0,0,0.12)'; fx.fillRect(0,0,32,1); fx.fillRect(0,0,1,32);
      const ftex = new THREE.CanvasTexture(fc); ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping;
      ftex.repeat.set(12, 10); ftex.magFilter = THREE.NearestFilter; ftex.minFilter = THREE.NearestFilter;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 20), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.95 }));
      floor.position.set(0, -0.25, 0); scene.add(floor);

      // rug
      const rug = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 7), new THREE.MeshStandardMaterial({ color: 0x3b4a6b, roughness: 0.9 }));
      rug.position.set(0, 0.04, 2.6); scene.add(rug);

      // walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xc6a583, roughness: 0.95 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 0.4), wallMat); back.position.set(0, 3, -10); scene.add(back);
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 20), wallMat); left.position.set(-12, 3, 0); scene.add(left);

      // windows on back wall (sky)
      const sky = this._windowTex(THREE);
      [-7, 0, 7].forEach((wx) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: sky }));
        win.position.set(wx, 3.8, -9.78); scene.add(win);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.0, 0.12), new THREE.MeshStandardMaterial({ color: 0xe7ddc8 }));
        fr.position.set(wx, 3.8, -9.85); scene.add(fr);
      });
      // AGENTS board
      const board = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.6), new THREE.MeshBasicMaterial({ map: this._boardTex(THREE) }));
      board.position.set(-9.78, 3.6, 0); board.rotation.y = Math.PI/2; scene.add(board);

      // desks
      AGENTS.forEach((a) => this._buildDesk(THREE, scene, a));

      // plants (simple)
      [[-11,8.5],[-11,-8.5],[11,8.5],[11,-8.5]].forEach((p) => {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.3,0.6,6), new THREE.MeshStandardMaterial({ color: 0x9c5a32 }));
        pot.position.set(p[0],0.3,p[1]); scene.add(pot);
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), new THREE.MeshStandardMaterial({ color: 0x3f8f4a, flatShading: true }));
        leaf.position.set(p[0],1.2,p[1]); scene.add(leaf);
      });
    }

    _buildDesk(THREE, scene, a) {
      const [dx, dz] = a.desk; const col = new THREE.Color(a.color);
      const top = new THREE.Mesh(new THREE.BoxGeometry(3, 0.16, 1.4), new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.8 }));
      top.position.set(dx, 1.0, dz); scene.add(top);
      [[-1.3,-0.5],[1.3,-0.5],[-1.3,0.5],[1.3,0.5]].forEach(([lx,lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12,1,0.12), new THREE.MeshStandardMaterial({ color: 0x5a3e25 }));
        leg.position.set(dx+lx, 0.5, dz+lz); scene.add(leg);
      });
      // monitor toward center
      const toC = dz > 0 ? -1 : 1;
      const mon = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.08), new THREE.MeshStandardMaterial({ color: 0x11161f, emissive: col, emissiveIntensity: 0.5 }));
      mon.position.set(dx, 1.62, dz + 0.45*toC); scene.add(mon);
    }

    _windowTex(THREE) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 40; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.fillStyle = '#7ec0e8'; x.fillRect(0,0,64,40);
      x.fillStyle = '#fff'; x.fillRect(8,6,10,4); x.fillRect(40,9,12,4);
      x.fillStyle = '#5a86c4'; x.fillRect(6,24,12,16); x.fillRect(22,18,10,22); x.fillStyle='#4f7bbf'; x.fillRect(38,22,12,18); x.fillRect(52,26,8,14);
      x.fillStyle = '#3f8f4a'; x.fillRect(0,36,64,4);
      const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t;
    }
    _boardTex(THREE) {
      const c = document.createElement('canvas'); c.width = 220; c.height = 104; const x = c.getContext('2d');
      x.fillStyle = '#f3f1ea'; x.fillRect(0,0,220,104); x.fillStyle = '#5a6478'; x.fillRect(0,0,220,16);
      x.fillStyle = '#1c2433'; x.font = '700 13px JetBrains Mono, monospace'; x.fillText('AI AGENTS', 10, 36);
      const cols = ['#2ee08a','#9b8cff','#46c6ff','#ff5fa8','#f7b32b']; const labs = ['Main','Research','Comms','Content','Ops'];
      cols.forEach((cc,i) => { x.fillStyle = cc; x.fillRect(12, 48+i*10, 7, 7); x.fillStyle = '#33404f'; x.font = '11px JetBrains Mono'; x.fillText(labs[i], 24, 55+i*10); });
      const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
    }

    // ---------- character ----------
    _buildChar(THREE, scene, a) {
      const frames = [0,1,2].map((f) => { const tex = new THREE.CanvasTexture(drawPixelChar(a, f)); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; return tex; });
      const mat = new THREE.SpriteMaterial({ map: frames[0], transparent: true });
      const spr = new THREE.Sprite(mat); spr.scale.set(2.0, 2.7, 1);
      const [wx, wz] = a.work; spr.position.set(wx, 1.35, wz);
      spr.userData.agentId = a.id; scene.add(spr); this._clickable.push(spr);

      const col = new THREE.Color(a.color);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI/2; ring.position.set(wx, 0.07, wz); scene.add(ring);
      const sel = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      sel.rotation.x = -Math.PI/2; sel.position.set(wx, 0.08, wz); scene.add(sel);

      const name = this._textSprite(THREE, { kind:'name', name:a.name, color:a.color });
      name.position.set(wx, 2.9, wz); scene.add(name);
      const bubble = this._textSprite(THREE, { kind:'bubble', name:a.name, color:a.color, text:'' });
      bubble.position.set(wx, 3.9, wz); bubble.visible = false; scene.add(bubble);

      this._chars[a.id] = {
        cfg:a, spr, mat, frames, ring, sel, name, bubble, col,
        x:wx, z:wz, tx:wx, tz:wz, moving:false, frame:0, pauseT:0,
        status:'idle', task:'',
      };
    }

    _textSprite(THREE, opt) {
      const c = document.createElement('canvas'); const ctx = c.getContext('2d');
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
      s.userData = { ...opt, ctx, canvas: c, THREE }; this._drawText(s, opt.text || ''); return s;
    }
    _drawText(s, text) {
      const { kind, name, color, ctx, canvas, THREE } = s.userData; const dpr = 2;
      if (kind === 'name') {
        const w = 300, h = 92; canvas.width = w*dpr; canvas.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
        ctx.font = '700 38px "Inter", "Anuphan", sans-serif'; const tw = ctx.measureText(name).width; const pw = tw+80, px = (w-pw)/2;
        rr(ctx, px, 22, pw, 50, 25); ctx.fillStyle = 'rgba(10,16,26,0.9)'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(px+30, 47, 9, 0, 7); ctx.fillStyle = color; ctx.fill();
        ctx.fillStyle = '#eef4ff'; ctx.textBaseline = 'middle'; ctx.fillText(name, px+48, 48);
        s.scale.set(3.0, 0.92, 1);
      } else {
        const w = 460, pad = 26; ctx.font = '500 34px "Anuphan", sans-serif';
        const words = (text||'').split(/(\s+)/); const maxW = w-pad*2; const lines = []; let line = '';
        for (const wd of words) { if (ctx.measureText(line+wd).width > maxW && line) { lines.push(line.trim()); line = wd; } else line += wd; }
        if (line.trim()) lines.push(line.trim());
        const lh = 42, tp = 70, h = tp + lines.length*lh + 28 + 22;
        canvas.width = w*dpr; canvas.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
        rr(ctx, 14, 14, w-28, h-50, 20); ctx.fillStyle = 'rgba(246,248,252,0.98)'; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.beginPath(); ctx.moveTo(w/2-16, h-36); ctx.lineTo(w/2+16, h-36); ctx.lineTo(w/2, h-8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(40, 46, 8, 0, 7); ctx.fillStyle = color; ctx.fill();
        ctx.font = '700 27px "Inter", "Anuphan", sans-serif'; ctx.fillStyle = '#0c1320'; ctx.textBaseline = 'middle'; ctx.fillText(name, 58, 46);
        ctx.font = '600 21px "Anuphan", sans-serif'; ctx.fillStyle = color; ctx.fillText('● กำลังทำงาน', w-176, 46);
        ctx.font = '500 34px "Anuphan", sans-serif'; ctx.fillStyle = '#1c2433';
        lines.forEach((ln,i) => ctx.fillText(ln, pad, tp+i*lh));
        s.scale.set(w/95, h/95, 1);
      }
      if (s.material.map) s.material.map.dispose();
      const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 4; s.material.map = tex; s.material.needsUpdate = true;
    }

    _apply(list) {
      list.forEach((u) => { const C = this._chars[u.id]; if (!C) return;
        C.status = u.status || 'idle';
        if (u.task != null) C.task = u.task;
        const working = C.status === 'working';
        if (working && C.task) { this._drawText(C.bubble, C.task); }
      });
    }

    _focus(id) { const C = this._chars[id]; if (!C || !this._controls) return; this._focusT = new this._THREE.Vector3(C.x, 1.4, C.z); }

    _frame(now) {
      if (!this._alive) return; const dt = Math.min(40, now - this._last); this._last = now; const t = (now - this._t0) / 1000;
      const sel = this._selected;
      Object.values(this._chars).forEach((C) => {
        const working = C.status === 'working';
        // target
        if (working) { C.tx = C.cfg.work[0]; C.tz = C.cfg.work[1]; }
        else if (C.pauseT > 0) { C.pauseT -= dt; C.tx = C.x; C.tz = C.z; }
        else if (Math.hypot(C.tx-C.x, C.tz-C.z) < 0.25) {
          C.tx = WANDER.x0 + Math.random()*(WANDER.x1-WANDER.x0); C.tz = WANDER.z0 + Math.random()*(WANDER.z1-WANDER.z0);
          if (Math.random() < 0.5) C.pauseT = 600 + Math.random()*1600;
        }
        const dx = C.tx-C.x, dz = C.tz-C.z, dist = Math.hypot(dx, dz); const spd = 0.0026*dt;
        if (dist > 0.08) { C.x += dx/dist*spd; C.z += dz/dist*spd; C.moving = true; } else C.moving = false;
        // position sprite + attachments
        C.spr.position.set(C.x, 1.35, C.z);
        C.ring.position.set(C.x, 0.07, C.z); C.sel.position.set(C.x, 0.08, C.z);
        C.name.position.set(C.x, 2.9, C.z);
        C.bubble.position.set(C.x, 3.95 + Math.sin(t*1.8 + C.x)*0.05, C.z);
        // walk frame
        const wf = C.moving ? (Math.floor(t*6) % 2 ? 1 : 2) : 0;
        if (wf !== C.frame) { C.frame = wf; C.mat.map = C.frames[wf]; C.mat.needsUpdate = true; }
        // dim idle
        C.mat.color.setScalar(working ? 1 : 0.62);
        // glow ring
        const on = (Math.sin(t*3 + C.x) + 1) / 2;
        C.ring.material.opacity += ((working ? 0.25 + on*0.4 : 0) - C.ring.material.opacity) * 0.2;
        C.ring.scale.setScalar(working ? 1 + on*0.12 : 1);
        // bubble
        C.bubble.visible = working && !!C.task;
        // selected ring
        C.sel.material.opacity += ((sel === C.cfg.id ? 0.9 : 0) - C.sel.material.opacity) * 0.2;
      });

      if (this._focusT && this._controls) {
        this._controls.target.lerp(this._focusT, 0.08);
        if (this._controls.target.distanceTo(this._focusT) < 0.06) this._focusT = null;
      }
      if (this._controls) this._controls.update();
      this._renderer.render(this._scene, this._cam);
    }
  }

  if (!customElements.get('office-pixel-scene')) customElements.define('office-pixel-scene', OfficePixelScene);
  const mark = (e) => document.querySelectorAll('office-pixel-scene').forEach((el) => { el._selected = e.detail && e.detail.id; });
  window.addEventListener('office:select', mark);
  window.addEventListener('office:focus', mark);
})();
