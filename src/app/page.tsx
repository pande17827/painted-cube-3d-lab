'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { Brush, MousePointerClick, Palette, Rotate3d } from 'lucide-react'
import ControlPanel from '@/components/cube/ControlPanel'
import LearnSection from '@/components/cube/LearnSection'
import QuizCard from '@/components/cube/QuizCard'
import type { CubeSel } from '@/lib/cube'
import type { GhostMode, ViewMode } from '@/components/cube/PaintedCubeScene'

const PaintedCubeScene = dynamic(() => import('@/components/cube/PaintedCubeScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-orange-400" />
        <p className="text-xs font-semibold text-slate-500">loading 3D engine…</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const [n, setN] = useState(4)
  const [explode, setExplode] = useState(0)
  const [mode, setMode] = useState<ViewMode>('realistic')
  const [filter, setFilter] = useState<number | null>(null)
  const [ghostMode, setGhostMode] = useState<GhostMode>('ghost')
  const [showLabels, setShowLabels] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [selected, setSelected] = useState<CubeSel | null>(null)

  const resetView = useCallback(() => setResetKey((k) => k + 1), [])

  const handleDemo = useCallback(
    (faces: number) => {
      const demo = { 3: { n: 3, explode: 0 }, 2: { n: 4, explode: 0.35 }, 1: { n: 5, explode: 0.55 }, 0: { n: 5, explode: 0.7 } }[faces]
      setN(demo.n)
      setExplode(demo.explode)
      setFilter(faces)
      setGhostMode('ghost')
      setShowLabels(true)
      setSelected(null)
      resetView()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [resetView],
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* ── header ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <Rotate3d className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight tracking-tight sm:text-xl">
                The Painted Cube <span className="text-orange-400">3D Lab</span>
              </h1>
              <p className="text-xs text-slate-400 sm:text-[13px]">
                Paint a cube · cut it into n³ pieces · explode, filter and count every painted face
              </p>
            </div>
          </div>
          <div className="ml-auto hidden flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400 md:flex">
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">Drag to rotate</span>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">Scroll to zoom</span>
            <span className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-orange-300">
              <MousePointerClick className="h-3.5 w-3.5" /> Click any cube to inspect
            </span>
          </div>
        </div>
      </header>

      {/* ── main ───────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-5 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          {/* 3D canvas */}
          <section aria-label="3D visualization" className="relative h-[58vh] min-h-[460px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 lg:h-[calc(100vh-160px)]">
            <PaintedCubeScene
              n={n}
              explode={explode}
              mode={mode}
              filter={filter}
              ghostMode={ghostMode}
              showLabels={showLabels}
              autoRotate={autoRotate}
              resetKey={resetKey}
              selected={selected}
              onSelect={setSelected}
            />

            {/* overlay: colour mode */}
            <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-xl border border-slate-700/70 bg-slate-900/85 p-1 backdrop-blur">
              <button
                onClick={() => setMode('realistic')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  mode === 'realistic' ? 'bg-orange-500/25 text-orange-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={mode === 'realistic'}
              >
                <Brush className="h-3.5 w-3.5" /> Realistic paint
              </button>
              <button
                onClick={() => setMode('type')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  mode === 'type' ? 'bg-teal-500/25 text-teal-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={mode === 'type'}
              >
                <Palette className="h-3.5 w-3.5" /> Colour by type
              </button>
            </div>

            {/* overlay: active filter chip */}
            {filter !== null && (
              <div className="absolute right-3 top-3 z-10 rounded-full border border-slate-600/70 bg-slate-900/85 px-3 py-1.5 text-[11px] font-bold text-slate-200 backdrop-blur">
                isolating: {filter} painted face{filter === 1 ? '' : 's'} · others {ghostMode === 'ghost' ? 'ghosted' : 'hidden'}
              </div>
            )}

            {/* bottom hint */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-slate-700/60 bg-slate-900/85 px-4 py-1.5 text-[11px] font-semibold text-slate-400 backdrop-blur">
              drag to rotate · scroll to zoom · click a cube for details
            </div>
          </section>

          {/* side panel */}
          <aside aria-label="controls and stats" className="flex flex-col gap-4">
            <ControlPanel
              n={n}
              setN={setN}
              explode={explode}
              setExplode={setExplode}
              mode={mode}
              setMode={setMode}
              filter={filter}
              setFilter={setFilter}
              ghostMode={ghostMode}
              setGhostMode={setGhostMode}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              resetView={resetView}
              selected={selected}
            />
            <QuizCard />
          </aside>
        </div>

        <LearnSection onDemo={handleDemo} />
      </main>

      {/* ── footer ─────────────────────────────────────────────── */}
      <footer className="mt-6 border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[11px] text-slate-500 lg:px-6">
          <span>
            The Painted Cube 3D Lab — built with Next.js, Three.js & Tailwind. Every count on this page is computed live from the geometry you see.
          </span>
          <span className="font-mono">8 + 12(n−2) + 6(n−2)² + (n−2)³ = n³</span>
        </div>
      </footer>
    </div>
  )
}
