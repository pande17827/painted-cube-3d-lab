'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import { categoryOf, countsFor, exampleCoordFor, facePainted, paintedCountOf, type CubeSel } from '@/lib/cube'

export type ViewMode = 'realistic' | 'type'
export type GhostMode = 'ghost' | 'hide'

export interface SceneProps {
  n: number
  explode: number // 0..1
  mode: ViewMode
  filter: number | null // null = show all
  ghostMode: GhostMode
  showLabels: boolean
  autoRotate: boolean
  resetKey: number
  selected: CubeSel | null
  onSelect: (sel: CubeSel | null) => void
}

interface Mats {
  paint: THREE.MeshStandardMaterial
  bare: THREE.MeshStandardMaterial
  paintG: THREE.MeshStandardMaterial
  bareG: THREE.MeshStandardMaterial
  type: Record<number, THREE.MeshStandardMaterial>
  typeG: Record<number, THREE.MeshStandardMaterial>
}

const CAT_HEX: Record<number, string> = { 3: '#FB923C', 2: '#2DD4BF', 1: '#A3E635', 0: '#94A3B8' }

/** world-space offsets that fan the four chips out around the cube */
const LABEL_OFFSETS: Record<number, [number, number, number]> = {
  3: [0, 1.15, 0], // floats above the front-top-right corner
  2: [0.95, 0.42, 0.42], // floats off the right face
  1: [-1.15, 0.85, -1.15], // floats above the top face, left of the corner chip
  0: [0, -0.55, 0], // centre, nudged down
}

/** module-level DOM registry — the canvas element mounts exactly once */
const overlayRegistry = {
  labels: {} as Record<number, HTMLDivElement | null>,
  tooltip: null as HTMLDivElement | null,
}

/** disables raycasting for ghost cubes (pointer events pass through them) */
const noRaycast = () => null

function buildMaterials(): Mats {
  const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.06, ...o })
  const ghost = (color: string) =>
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.06,
      roughness: 0.7,
      metalness: 0,
      depthWrite: false,
    })
  const type = {} as Record<number, THREE.MeshStandardMaterial>
  const typeG = {} as Record<number, THREE.MeshStandardMaterial>
  for (const f of [3, 2, 1, 0]) {
    type[f] = std(CAT_HEX[f])
    typeG[f] = ghost(CAT_HEX[f])
  }
  return {
    paint: std('#F59E0B'),
    bare: std('#D8CCB3', { roughness: 0.78 }),
    paintG: ghost('#F59E0B'),
    bareG: ghost('#D8CCB3'),
    type,
    typeG,
  }
}

function disposeMats(m: Mats) {
  ;[m.paint, m.bare, m.paintG, m.bareG, ...Object.values(m.type), ...Object.values(m.typeG)].forEach((x) =>
    x.dispose(),
  )
}

/** shared layout math for the 3D field and the DOM overlay */
function cubeLayout(n: number, explode: number) {
  const spacing = 1.045 + explode * 1.35
  const c = (n - 1) / 2
  const half = (n * spacing) / 2
  const posOf = (s: { x: number; y: number; z: number }): [number, number, number] => [
    (s.x - c) * spacing,
    (s.y - c) * spacing,
    (s.z - c) * spacing,
  ]
  const anchors: Record<number, [number, number, number] | undefined> = {}
  for (const f of [3, 2, 1, 0]) {
    const ex = exampleCoordFor(f, n)
    if (!ex) continue
    const [ox, oy, oz] = LABEL_OFFSETS[f]
    const [px, py, pz] = posOf(ex)
    anchors[f] = [px + ox, py + oy, pz + oz]
  }
  return { spacing, c, half, posOf, anchors }
}

// ── one small cube ────────────────────────────────────────────────────────────
interface SmallCubeProps {
  x: number
  y: number
  z: number
  n: number
  count: number
  position: [number, number, number]
  mode: ViewMode
  visibility: 'normal' | 'ghost' | 'hidden'
  mats: Mats
  geometry: THREE.BoxGeometry
  hovered: boolean
  onHover: (sel: CubeSel | null) => void
  onSelect: (sel: CubeSel) => void
}

const SmallCube = memo(function SmallCube({
  x,
  y,
  z,
  n,
  count,
  position,
  mode,
  visibility,
  mats,
  geometry,
  hovered,
  onHover,
  onSelect,
}: SmallCubeProps) {
  if (visibility === 'hidden') return null

  let six: THREE.MeshStandardMaterial[]
  if (mode === 'type') {
    const m = visibility === 'ghost' ? mats.typeG[count] : mats.type[count]
    six = [m, m, m, m, m, m]
  } else {
    const f = facePainted(x, y, z, n)
    const p = visibility === 'ghost' ? mats.paintG : mats.paint
    const b = visibility === 'ghost' ? mats.bareG : mats.bare
    six = [f.px ? p : b, f.nx ? p : b, f.py ? p : b, f.ny ? p : b, f.pz ? p : b, f.nz ? p : b]
  }

  // NOTE: never pass raycast={undefined} — it would wipe Object3D.prototype.raycast
  const ghostProps = visibility === 'ghost' ? { raycast: noRaycast } : {}

  return (
    <mesh
      position={position}
      scale={hovered ? 1.14 : 1}
      geometry={geometry}
      {...ghostProps}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        onHover({ x, y, z, count })
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'auto'
        onHover(null)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect({ x, y, z, count })
      }}
    >
      {six.map((m, i) => (
        <primitive key={i} object={m} attach={`material-${i}`} />
      ))}
    </mesh>
  )
})

// ── camera helper ─────────────────────────────────────────────────────────────
function CameraRig({ n, resetKey, autoRotate }: { n: number; resetKey: number; autoRotate: boolean }) {
  const controls = useRef<any>(null)
  const { camera } = useThree()

  useEffect(() => {
    const d = 3.4 + n * 1.95
    camera.position.set(d * 0.95, d * 0.62, d * 1.0)
    camera.lookAt(0, 0, 0)
    if (controls.current) {
      controls.current.target.set(0, 0, 0)
      controls.current.update()
    }
  }, [n, resetKey, camera])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={0.9}
      enableDamping
      dampingFactor={0.08}
      minDistance={3.5}
      maxDistance={220}
      maxPolarAngle={Math.PI * 0.93}
    />
  )
}

// ── DOM-overlay position tracker (runs inside the canvas, mutates outside DOM) ──
interface TrackerProps {
  anchors: Record<number, [number, number, number] | undefined>
  labelsOn: boolean
  tooltipAnchor: [number, number, number] | null
}

function OverlayTracker({ anchors, labelsOn, tooltipAnchor }: TrackerProps) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const place = (a: [number, number, number] | null, el: HTMLDivElement | null) => {
      if (!el) return
      if (!a) {
        el.style.opacity = '0'
        return
      }
      v.set(a[0], a[1], a[2]).project(camera)
      if (v.z > 1 || v.z < -1) {
        el.style.opacity = '0'
        return
      }
      const sx = (v.x * 0.5 + 0.5) * size.width
      const sy = (-v.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`
      el.style.zIndex = String(Math.round((1 - v.z) * 400))
      el.style.opacity = '1'
    }

    for (const f of [3, 2, 1, 0]) {
      const el = overlayRegistry.labels[f] ?? null
      place(labelsOn ? anchors[f] ?? null : null, el)
    }
    place(tooltipAnchor, overlayRegistry.tooltip)
  })

  return null
}

// ── scene content (n-aware layout) ───────────────────────────────────────────
function SceneContent(
  props: SceneProps & {
    hovered: CubeSel | null
    setHovered: (s: CubeSel | null) => void
  },
) {
  const { n, explode, mode, filter, ghostMode, selected, onSelect, hovered, setHovered } = props

  const mats = useMemo(() => buildMaterials(), [])
  useEffect(() => () => disposeMats(mats), [mats])

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const selEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.08, 1.08, 1.08)), [])
  useEffect(() => () => selEdges.dispose(), [selEdges])

  const { spacing, c, half, posOf, anchors } = useMemo(() => cubeLayout(n, explode), [n, explode])

  const cubes = useMemo(() => {
    const arr: { x: number; y: number; z: number; count: number }[] = []
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++)
        for (let z = 0; z < n; z++) arr.push({ x, y, z, count: paintedCountOf(x, y, z, n) })
    return arr
  }, [n])

  const onHover = useCallback((s: CubeSel | null) => setHovered(s), [setHovered])
  const onSelectCube = useCallback((s: CubeSel) => onSelect(s), [onSelect])

  const visibilityOf = (count: number): 'normal' | 'ghost' | 'hidden' => {
    if (filter === null || filter === count) return 'normal'
    return ghostMode === 'ghost' ? 'ghost' : 'hidden'
  }

  const tooltipAnchor: [number, number, number] | null = useMemo(() => {
    if (!hovered) return null
    const [px, py, pz] = posOf(hovered)
    return [px, py + 0.85, pz]
  }, [hovered, posOf])

  return (
    <>
      <CameraRig n={n} resetKey={props.resetKey} autoRotate={props.autoRotate} />
      <OverlayTracker anchors={anchors} labelsOn={props.showLabels} tooltipAnchor={tooltipAnchor} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[7, 11, 6]} intensity={1.25} />
      <directionalLight position={[-9, 3, -7]} intensity={0.32} />
      <pointLight position={[0, -6, 0]} intensity={0.25} />

      {cubes.map((cube) => (
        <SmallCube
          key={`${cube.x}-${cube.y}-${cube.z}`}
          x={cube.x}
          y={cube.y}
          z={cube.z}
          n={n}
          count={cube.count}
          position={[(cube.x - c) * spacing, (cube.y - c) * spacing, (cube.z - c) * spacing]}
          mode={mode}
          visibility={visibilityOf(cube.count)}
          mats={mats}
          geometry={geometry}
          hovered={hovered?.x === cube.x && hovered?.y === cube.y && hovered?.z === cube.z}
          onHover={onHover}
          onSelect={onSelectCube}
        />
      ))}

      {/* selection outline */}
      {selected && (
        <lineSegments position={posOf(selected)} renderOrder={999}>
          <primitive object={selEdges} attach="geometry" />
          <lineBasicMaterial color="#FFFFFF" transparent opacity={0.95} depthTest={false} />
        </lineSegments>
      )}

      <Grid
        position={[0, -half - 0.9, 0]}
        args={[30, 30]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.55}
        cellColor={'#1E293B'}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={'#334155'}
        fadeDistance={85}
        fadeStrength={1.2}
        followCamera={false}
      />
    </>
  )
}

// ── exported canvas wrapper + DOM overlay ─────────────────────────────────────
export default function PaintedCubeScene(props: SceneProps) {
  const [hovered, setHovered] = useState<CubeSel | null>(null)

  const { anchors } = useMemo(() => cubeLayout(props.n, props.explode), [props.n, props.explode])
  const counts = useMemo(() => countsFor(props.n), [props.n])

  const chips = [3, 2, 1, 0].map((f) => {
    if (!exampleCoordFor(f, props.n)) return null
    const cat = categoryOf(f)
    return (
      <div
        key={f}
        ref={(el) => {
          overlayRegistry.labels[f] = el
        }}
        className="pointer-events-none absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 shadow-lg backdrop-blur"
        style={{ borderColor: cat.hex + '66', background: 'rgba(2,6,23,0.82)', opacity: 0 }}
      >
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: cat.hex }} />
        <span className="text-[11px] font-bold" style={{ color: cat.hex }}>
          {cat.place} ×{counts[f]}
        </span>
      </div>
    )
  })

  const tooltipCat = hovered ? categoryOf(hovered.count) : null

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 45, position: [11, 8, 12] }}
        gl={{ antialias: true }}
        onPointerMissed={() => {
          props.onSelect(null)
          setHovered(null)
        }}
      >
        <color attach="background" args={['#020617']} />
        <SceneContent {...props} hovered={hovered} setHovered={setHovered} />
      </Canvas>

      {/* DOM overlay: category chips + hover tooltip (positioned via useFrame projection) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {chips}
        <div
          ref={(el) => {
            overlayRegistry.tooltip = el
          }}
          className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-lg border border-slate-600/80 bg-slate-900/95 px-3 py-1.5 shadow-2xl backdrop-blur"
          style={{ opacity: 0 }}
        >
          {tooltipCat && hovered && (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CAT_HEX[hovered.count] }} />
                <span className="text-xs font-bold text-slate-100">{tooltipCat.name}</span>
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                cube ({hovered.x}, {hovered.y}, {hovered.z}) · {tooltipCat.place}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
