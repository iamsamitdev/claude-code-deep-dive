import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ===== ฉาก Office 3D (พอร์ตจาก office-pixel-scene.js ของอาจารย์สามิตร) =====
// ตัวละคร pixel-art เดินสุ่มเมื่อว่าง และเดินไปโต๊ะเมื่อทำงาน

export interface OfficeAgentDef {
  id: string
  name: string
  color: string
  skin: string
  hair: string
  desk: [number, number]
  work: [number, number]
}

export interface AgentUpdate {
  id: string
  status: string
  task?: string
}

export interface OfficeHandle {
  update: (agents: AgentUpdate[]) => void
  dispose: () => void
}

// 6 agent ของ AgentFlow PoC (Main + 5 sub)
const AGENTS: OfficeAgentDef[] = [
  { id: 'main', name: 'Main', color: '#2ee08a', skin: '#f2c79a', hair: '#3a2a1a', desk: [0, -7], work: [0, -4.4] },
  { id: 'research', name: 'Research', color: '#9b8cff', skin: '#e8b483', hair: '#1d1d24', desk: [-9, -2.5], work: [-6.3, -2.5] },
  { id: 'code', name: 'Code', color: '#46c6ff', skin: '#f2c79a', hair: '#2a1c12', desk: [9, -2.5], work: [6.3, -2.5] },
  { id: 'content', name: 'Content', color: '#ff5fa8', skin: '#e8b483', hair: '#0f0f14', desk: [-8, 6], work: [-5.2, 4.2] },
  { id: 'data', name: 'Data', color: '#f7b32b', skin: '#f2c79a', hair: '#23364a', desk: [8, 6], work: [5.2, 4.2] },
  { id: 'ops', name: 'Ops', color: '#5ad1c4', skin: '#e8b483', hair: '#101820', desk: [0, 8], work: [0, 5.6] }
]
const WANDER = { x0: -4.5, x1: 4.5, z0: 0, z1: 5.5 }

// สีประจำ slot สำหรับ UI ภายนอกฉาก (แผงสถานะเอเจนต์ + แถบเลือกด้านล่าง)
export const SLOT_COLORS: Record<string, string> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a.color])
)

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

function drawPixelChar(a: OfficeAgentDef, frame: number) {
  const c = document.createElement('canvas'); c.width = 18; c.height = 24
  const x = c.getContext('2d')!; x.imageSmoothingEnabled = false
  const P = (px: number, py: number, w: number, h: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, w, h) }
  const cx = 9, top = 1
  const sh = a.color, sk = a.skin, hr = a.hair, pant = '#2a2f3d'
  if (frame === 1) { P(cx - 3, top + 15, 3, 7, pant); P(cx, top + 16, 3, 6, pant) }
  else if (frame === 2) { P(cx - 3, top + 16, 3, 6, pant); P(cx, top + 15, 3, 7, pant) }
  else { P(cx - 3, top + 16, 3, 6, pant); P(cx, top + 16, 3, 6, pant) }
  P(cx - 5, top + 9, 10, 8, sh)
  P(cx - 6, top + 9, 2, 6, sh); P(cx + 5, top + 9, 2, 6, sh)
  P(cx - 4, top + 2, 8, 8, sk)
  P(cx - 4, top + 1, 8, 3, hr); P(cx - 5, top + 2, 1, 3, hr); P(cx + 4, top + 2, 1, 3, hr)
  P(cx - 2, top + 5, 1, 2, '#1a1a26'); P(cx + 1, top + 5, 1, 2, '#1a1a26')
  return c
}

interface CharState {
  cfg: OfficeAgentDef
  spr: THREE.Sprite
  mat: THREE.SpriteMaterial
  frames: THREE.CanvasTexture[]
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  name: THREE.Sprite
  bubble: THREE.Sprite
  bubbleCtx: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; color: string; name: string }
  x: number; z: number; tx: number; tz: number
  moving: boolean; frame: number; pauseT: number
  status: string; task: string
}

export function createOfficeScene(el: HTMLElement, onSelect?: (id: string) => void): OfficeHandle {
  const W = el.clientWidth || 800, H = el.clientHeight || 600
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H)
  renderer.domElement.style.display = 'block'
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x0a0f17, 30, 60)

  const D = 11
  const cam = new THREE.OrthographicCamera(-D * (W / H), D * (W / H), D, -D, -60, 120)
  cam.position.set(15, 13, 15); cam.lookAt(0, 1.4, 0)

  const controls = new OrbitControls(cam, renderer.domElement)
  controls.target.set(0, 1.4, 0); controls.enableDamping = true; controls.dampingFactor = 0.08
  controls.enablePan = false; controls.minZoom = 0.7; controls.maxZoom = 2.4
  controls.minPolarAngle = 0.5; controls.maxPolarAngle = 1.18; controls.update()

  scene.add(new THREE.AmbientLight(0xb6c6e0, 0.7))
  const key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(8, 16, 10); scene.add(key)
  const fill = new THREE.DirectionalLight(0x4a6bd0, 0.3); fill.position.set(-10, 6, -8); scene.add(fill)

  const clickable: THREE.Object3D[] = []
  const chars: Record<string, CharState> = {}

  buildRoom()
  AGENTS.forEach(buildChar)

  function windowTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 40; const x = c.getContext('2d')!; x.imageSmoothingEnabled = false
    x.fillStyle = '#7ec0e8'; x.fillRect(0, 0, 64, 40)
    x.fillStyle = '#fff'; x.fillRect(8, 6, 10, 4); x.fillRect(40, 9, 12, 4)
    x.fillStyle = '#5a86c4'; x.fillRect(6, 24, 12, 16); x.fillRect(22, 18, 10, 22); x.fillStyle = '#4f7bbf'; x.fillRect(38, 22, 12, 18); x.fillRect(52, 26, 8, 14)
    x.fillStyle = '#3f8f4a'; x.fillRect(0, 36, 64, 4)
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t
  }
  function boardTex() {
    const c = document.createElement('canvas'); c.width = 220; c.height = 116; const x = c.getContext('2d')!
    x.fillStyle = '#f3f1ea'; x.fillRect(0, 0, 220, 116); x.fillStyle = '#5a6478'; x.fillRect(0, 0, 220, 16)
    x.fillStyle = '#1c2433'; x.font = '700 13px JetBrains Mono, monospace'; x.fillText('AI AGENTS', 10, 34)
    AGENTS.forEach((a, i) => { x.fillStyle = a.color; x.fillRect(12, 46 + i * 11, 7, 7); x.fillStyle = '#33404f'; x.font = '11px JetBrains Mono'; x.fillText(a.name, 24, 53 + i * 11) })
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
  }

  function buildRoom() {
    const fc = document.createElement('canvas'); fc.width = 32; fc.height = 32; const fx = fc.getContext('2d')!
    fx.fillStyle = '#8a7860'; fx.fillRect(0, 0, 32, 32)
    fx.fillStyle = '#80705a'; fx.fillRect(0, 0, 16, 16); fx.fillRect(16, 16, 16, 16)
    fx.fillStyle = 'rgba(0,0,0,0.12)'; fx.fillRect(0, 0, 32, 1); fx.fillRect(0, 0, 1, 32)
    const ftex = new THREE.CanvasTexture(fc); ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping
    ftex.repeat.set(12, 10); ftex.magFilter = THREE.NearestFilter; ftex.minFilter = THREE.NearestFilter
    const floor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 20), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.95 }))
    floor.position.set(0, -0.25, 0); scene.add(floor)
    const rug = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 7), new THREE.MeshStandardMaterial({ color: 0x3b4a6b, roughness: 0.9 }))
    rug.position.set(0, 0.04, 2.6); scene.add(rug)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xc6a583, roughness: 0.95 })
    const back = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 0.4), wallMat); back.position.set(0, 3, -10); scene.add(back)
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 20), wallMat); left.position.set(-12, 3, 0); scene.add(left)
    const sky = windowTex()
    ;[-7, 0, 7].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: sky }))
      win.position.set(wx, 3.8, -9.78); scene.add(win)
      const fr = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.0, 0.12), new THREE.MeshStandardMaterial({ color: 0xe7ddc8 }))
      fr.position.set(wx, 3.8, -9.85); scene.add(fr)
    })
    const board = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.9), new THREE.MeshBasicMaterial({ map: boardTex() }))
    board.position.set(-9.78, 3.6, 0); board.rotation.y = Math.PI / 2; scene.add(board)
    AGENTS.forEach(buildDesk)
    ;[[-11, 8.5], [-11, -8.5], [11, 8.5], [11, -8.5]].forEach((p) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x9c5a32 }))
      pot.position.set(p[0], 0.3, p[1]); scene.add(pot)
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), new THREE.MeshStandardMaterial({ color: 0x3f8f4a, flatShading: true }))
      leaf.position.set(p[0], 1.2, p[1]); scene.add(leaf)
    })
  }

  function buildDesk(a: OfficeAgentDef) {
    const [dx, dz] = a.desk; const col = new THREE.Color(a.color)
    const top = new THREE.Mesh(new THREE.BoxGeometry(3, 0.16, 1.4), new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.8 }))
    top.position.set(dx, 1.0, dz); scene.add(top)
    ;([[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]] as const).forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), new THREE.MeshStandardMaterial({ color: 0x5a3e25 }))
      leg.position.set(dx + lx, 0.5, dz + lz); scene.add(leg)
    })
    const toC = dz > 0 ? -1 : 1
    const mon = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.08), new THREE.MeshStandardMaterial({ color: 0x11161f, emissive: col, emissiveIntensity: 0.5 }))
    mon.position.set(dx, 1.62, dz + 0.45 * toC); scene.add(mon)
  }

  function makeTextSprite(): THREE.Sprite {
    return new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }))
  }
  function drawName(s: THREE.Sprite, name: string, color: string) {
    const dpr = 2, w = 300, h = 92
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')!
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h)
    ctx.font = '700 38px "Inter", "Anuphan", sans-serif'; const tw = ctx.measureText(name).width; const pw = tw + 80, px = (w - pw) / 2
    rr(ctx, px, 22, pw, 50, 25); ctx.fillStyle = 'rgba(10,16,26,0.9)'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath(); ctx.arc(px + 30, 47, 9, 0, 7); ctx.fillStyle = color; ctx.fill()
    ctx.fillStyle = '#eef4ff'; ctx.textBaseline = 'middle'; ctx.fillText(name, px + 48, 48)
    s.scale.set(3.0, 0.92, 1)
    if (s.material.map) s.material.map.dispose()
    const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 4; s.material.map = tex; s.material.needsUpdate = true
  }
  function drawBubble(C: CharState, text: string) {
    const { canvas, ctx, color, name } = C.bubbleCtx; const dpr = 2, w = 460, pad = 26
    ctx.font = '500 34px "Anuphan", sans-serif'
    const words = (text || '').split(/(\s+)/); const maxW = w - pad * 2; const lines: string[] = []; let line = ''
    for (const wd of words) { if (ctx.measureText(line + wd).width > maxW && line) { lines.push(line.trim()); line = wd } else line += wd }
    if (line.trim()) lines.push(line.trim())
    const lh = 42, tp = 70, h = tp + lines.length * lh + 28 + 22
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h)
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6
    rr(ctx, 14, 14, w - 28, h - 50, 20); ctx.fillStyle = 'rgba(246,248,252,0.98)'; ctx.fill(); ctx.shadowColor = 'transparent'
    ctx.beginPath(); ctx.moveTo(w / 2 - 16, h - 36); ctx.lineTo(w / 2 + 16, h - 36); ctx.lineTo(w / 2, h - 8); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.arc(40, 46, 8, 0, 7); ctx.fillStyle = color; ctx.fill()
    ctx.font = '700 27px "Inter", "Anuphan", sans-serif'; ctx.fillStyle = '#0c1320'; ctx.textBaseline = 'middle'; ctx.fillText(name, 58, 46)
    ctx.font = '600 21px "Anuphan", sans-serif'; ctx.fillStyle = color; ctx.fillText('● กำลังทำงาน', w - 176, 46)
    ctx.font = '500 34px "Anuphan", sans-serif'; ctx.fillStyle = '#1c2433'
    lines.forEach((ln, i) => ctx.fillText(ln, pad, tp + i * lh))
    if (C.bubble.material.map) C.bubble.material.map.dispose()
    const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 4; C.bubble.material.map = tex; C.bubble.material.needsUpdate = true
    C.bubble.scale.set(w / 95, h / 95, 1)
  }

  function buildChar(a: OfficeAgentDef) {
    const frames = [0, 1, 2].map((f) => { const tex = new THREE.CanvasTexture(drawPixelChar(a, f)); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; return tex })
    const mat = new THREE.SpriteMaterial({ map: frames[0], transparent: true })
    const spr = new THREE.Sprite(mat); spr.scale.set(2.0, 2.7, 1)
    const [wx, wz] = a.work; spr.position.set(wx, 1.35, wz)
    spr.userData.agentId = a.id; scene.add(spr); clickable.push(spr)
    const col = new THREE.Color(a.color)
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2; ring.position.set(wx, 0.07, wz); scene.add(ring)
    const name = makeTextSprite(); name.position.set(wx, 2.9, wz); scene.add(name); drawName(name, a.name, a.color)
    const bubble = makeTextSprite(); bubble.position.set(wx, 3.9, wz); bubble.visible = false; scene.add(bubble)
    const bc = document.createElement('canvas')
    chars[a.id] = {
      cfg: a, spr, mat, frames, ring, name, bubble,
      bubbleCtx: { canvas: bc, ctx: bc.getContext('2d')!, color: a.color, name: a.name },
      x: wx, z: wz, tx: wx, tz: wz, moving: false, frame: 0, pauseT: 0, status: 'idle', task: ''
    }
  }

  // ----- interaction -----
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2()
  let down: [number, number] | null = null
  const dom = renderer.domElement
  function pick(e: PointerEvent): string | null {
    const r = dom.getBoundingClientRect()
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1
    ray.setFromCamera(ndc, cam)
    const hits = ray.intersectObjects(clickable, false)
    return hits.length ? (hits[0].object.userData.agentId as string) : null
  }
  const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY] }
  const onUp = (e: PointerEvent) => {
    if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null
    if (moved > 6) return; const id = pick(e); if (id && onSelect) onSelect(id)
  }
  const onMove = (e: PointerEvent) => { dom.style.cursor = pick(e) ? 'pointer' : 'grab' }
  dom.addEventListener('pointerdown', onDown); dom.addEventListener('pointerup', onUp); dom.addEventListener('pointermove', onMove)

  const ro = new ResizeObserver(() => {
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return
    renderer.setSize(w, h); const a = w / h
    cam.left = -D * a; cam.right = D * a; cam.top = D; cam.bottom = -D; cam.updateProjectionMatrix()
  })
  ro.observe(el)

  // ----- loop -----
  const t0 = performance.now(); let last = t0; let alive = true; let raf = 0
  function frame(now: number) {
    if (!alive) return
    const dt = Math.min(40, now - last); last = now; const t = (now - t0) / 1000
    Object.values(chars).forEach((C) => {
      const working = C.status === 'working'
      if (working) { C.tx = C.cfg.work[0]; C.tz = C.cfg.work[1] }
      else if (C.pauseT > 0) { C.pauseT -= dt; C.tx = C.x; C.tz = C.z }
      else if (Math.hypot(C.tx - C.x, C.tz - C.z) < 0.25) {
        C.tx = WANDER.x0 + Math.random() * (WANDER.x1 - WANDER.x0); C.tz = WANDER.z0 + Math.random() * (WANDER.z1 - WANDER.z0)
        if (Math.random() < 0.5) C.pauseT = 600 + Math.random() * 1600
      }
      const dx = C.tx - C.x, dz = C.tz - C.z, dist = Math.hypot(dx, dz); const spd = 0.0026 * dt
      if (dist > 0.08) { C.x += dx / dist * spd; C.z += dz / dist * spd; C.moving = true } else C.moving = false
      C.spr.position.set(C.x, 1.35, C.z); C.ring.position.set(C.x, 0.07, C.z)
      C.name.position.set(C.x, 2.9, C.z); C.bubble.position.set(C.x, 3.95 + Math.sin(t * 1.8 + C.x) * 0.05, C.z)
      const wf = C.moving ? (Math.floor(t * 6) % 2 ? 1 : 2) : 0
      if (wf !== C.frame) { C.frame = wf; C.mat.map = C.frames[wf]; C.mat.needsUpdate = true }
      C.mat.color.setScalar(working ? 1 : 0.62)
      const on = (Math.sin(t * 3 + C.x) + 1) / 2
      C.ring.material.opacity += ((working ? 0.25 + on * 0.4 : 0) - C.ring.material.opacity) * 0.2
      C.ring.scale.setScalar(working ? 1 + on * 0.12 : 1)
      C.bubble.visible = working && !!C.task
    })
    controls.update()
    renderer.render(scene, cam)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    update(list: AgentUpdate[]) {
      list.forEach((u) => {
        const C = chars[u.id]; if (!C) return
        C.status = u.status || 'idle'
        if (u.task != null) C.task = u.task
        if (C.status === 'working' && C.task) drawBubble(C, C.task)
      })
    },
    dispose() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect()
      dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointerup', onUp); dom.removeEventListener('pointermove', onMove)
      controls.dispose(); renderer.dispose(); renderer.domElement.remove()
    }
  }
}
