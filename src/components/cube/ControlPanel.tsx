'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MousePointerClick, RotateCcw, Scissors, Sparkles } from 'lucide-react'
import { CATEGORIES, categoryOf, countsFor, facePainted, FACE_LABELS, type CubeSel } from '@/lib/cube'
import type { GhostMode, ViewMode } from './PaintedCubeScene'

interface ControlPanelProps {
  n: number
  setN: (n: number) => void
  explode: number
  setExplode: (v: number) => void
  mode: ViewMode
  setMode: (m: ViewMode) => void
  filter: number | null
  setFilter: (f: number | null) => void
  ghostMode: GhostMode
  setGhostMode: (g: GhostMode) => void
  showLabels: boolean
  setShowLabels: (v: boolean) => void
  autoRotate: boolean
  setAutoRotate: (v: boolean) => void
  resetView: () => void
  selected: CubeSel | null
}

export default function ControlPanel(props: ControlPanelProps) {
  const { n, explode, mode, filter, ghostMode, showLabels, autoRotate, selected } = props
  const counts = useMemo(() => countsFor(n), [n])

  return (
    <div className="flex flex-col gap-4">
      {/* ── live counts ─────────────────────────────────────────── */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold tracking-wide text-slate-200">LIVE COUNTS — CLICK TO ISOLATE</CardTitle>
            {filter !== null && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-slate-300 hover:text-white"
                onClick={() => props.setFilter(null)}
              >
                <RotateCcw className="mr-1 h-3 w-3" /> show all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const active = filter === cat.faces
            const zero = counts[cat.faces] === 0
            return (
              <button
                key={cat.faces}
                onClick={() => props.setFilter(active ? null : cat.faces)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all hover:border-slate-500 ${
                  active ? 'border-slate-400 bg-slate-800/80 shadow-[0_0_18px_rgba(255,255,255,0.06)]' : 'border-slate-800 bg-slate-950/40'
                }`}
                aria-pressed={active}
              >
                <span className="inline-block h-4 w-4 shrink-0 rounded-[5px] border" style={{ background: cat.hex + '2E', borderColor: cat.hex }}>
                  <span className="block h-full w-full scale-[0.55] rounded-[3px]" style={{ background: cat.hex }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold leading-tight text-slate-100">{cat.name}</span>
                  <span className="block text-[11px] leading-tight text-slate-400">
                    {cat.place} · <span className="font-mono text-[10.5px]">{cat.formula}</span>
                    {zero && <span className="ml-1 italic">— none at n = {n}</span>}
                  </span>
                </span>
                <span className="text-xl font-black tabular-nums" style={{ color: cat.hex }}>
                  {counts[cat.faces]}
                </span>
              </button>
            )
          })}
          <div className="mt-1 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 px-3 py-2 text-center font-mono text-[11px] text-slate-300">
            {counts[3]} + {counts[2]} + {counts[1]} + {counts[0]} = <span className="font-bold text-orange-300">{counts.total}</span>
            {' = '}n³ ✓
          </div>
        </CardContent>
      </Card>

      {/* ── controls ────────────────────────────────────────────── */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-200">
            <Scissors className="h-4 w-4 text-orange-400" /> LAB CONTROLS
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300">Divisions per edge (n)</Label>
              <span className="rounded-md bg-orange-500/15 px-2 py-0.5 font-mono text-xs font-bold text-orange-300">n = {n}</span>
            </div>
            <Slider value={[n]} min={2} max={10} step={1} onValueChange={([v]) => props.setN(v)} aria-label="divisions per edge" />
            <p className="text-[11px] text-slate-500">cuts the big cube into n × n × n = {n ** 3} small cubes</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300">Explode view</Label>
              <span className="rounded-md bg-teal-500/15 px-2 py-0.5 font-mono text-xs font-bold text-teal-300">{Math.round(explode * 100)}%</span>
            </div>
            <Slider value={[Math.round(explode * 100)]} min={0} max={100} step={1} onValueChange={([v]) => props.setExplode(v / 100)} aria-label="explode" />
            <p className="text-[11px] text-slate-500">pull the pieces apart to see inside — the hidden core lives here</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-slate-300">Colour mode</Label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && props.setMode(v as ViewMode)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 p-1"
            >
              <ToggleGroupItem value="realistic" className="flex-1 text-xs data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-300">
                Realistic paint
              </ToggleGroupItem>
              <ToggleGroupItem value="type" className="flex-1 text-xs data-[state=on]:bg-teal-500/20 data-[state=on]:text-teal-300">
                Colour by type
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-slate-300">When isolating a type, others become…</Label>
            <ToggleGroup
              type="single"
              value={ghostMode}
              onValueChange={(v) => v && props.setGhostMode(v as GhostMode)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 p-1"
            >
              <ToggleGroupItem value="ghost" className="flex-1 text-xs data-[state=on]:bg-slate-700/60">
                Ghost (see-through)
              </ToggleGroupItem>
              <ToggleGroupItem value="hide" className="flex-1 text-xs data-[state=on]:bg-slate-700/60">
                Hidden
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300">Floating labels</Label>
            <Switch checked={showLabels} onCheckedChange={props.setShowLabels} aria-label="toggle labels" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300">Auto-rotate</Label>
            <Switch checked={autoRotate} onCheckedChange={props.setAutoRotate} aria-label="toggle rotation" />
          </div>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-200 hover:bg-slate-800" onClick={props.resetView}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset camera
          </Button>
        </CardContent>
      </Card>

      {/* ── selection details ───────────────────────────────────── */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-200">
            <MousePointerClick className="h-4 w-4 text-lime-400" /> CUBE INSPECTOR
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-5 w-5 rounded-md border" style={{ background: categoryOf(selected.count).hex + '2E', borderColor: categoryOf(selected.count).hex }} />
                <span className="text-base font-black" style={{ color: categoryOf(selected.count).hex }}>
                  {categoryOf(selected.count).name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2">
                  <div className="text-slate-500">grid position (x, y, z)</div>
                  <div className="font-mono font-bold text-slate-200">
                    ({selected.x}, {selected.y}, {selected.z})
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2">
                  <div className="text-slate-500">lives on</div>
                  <div className="font-bold text-slate-200">{categoryOf(selected.count).place}</div>
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">painted faces of this cube</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(facePainted(selected.x, selected.y, selected.z, n)).map(([k, painted]) => (
                    <span
                      key={k}
                      className={`rounded-md border px-2 py-1 text-[11px] font-bold ${
                        painted ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-slate-800 bg-slate-950/60 text-slate-600'
                      }`}
                    >
                      {FACE_LABELS[k as keyof typeof FACE_LABELS]} {painted ? '· painted' : '· bare'}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-400">{categoryOf(selected.count).desc}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-5 text-slate-400">
              <Sparkles className="h-5 w-5 shrink-0 text-slate-500" />
              <p className="text-xs leading-relaxed">
                Click any small cube in the 3D view to inspect it — see its painted faces, its grid address and which family it belongs to.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
