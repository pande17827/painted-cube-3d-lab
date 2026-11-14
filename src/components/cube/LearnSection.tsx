'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Box, Eye } from 'lucide-react'
import { CATEGORIES } from '@/lib/cube'

const DEMOS: Record<number, { n: number; explode: number; hint: string }> = {
  3: { n: 3, explode: 0, hint: 'corner cube selected in a 3×3×3 cut' },
  2: { n: 4, explode: 0.35, hint: 'edges pulled apart in a 4×4×4 cut' },
  1: { n: 5, explode: 0.55, hint: 'face centres revealed in a 5×5×5 cut' },
  0: { n: 5, explode: 0.7, hint: 'exploded 5×5×5 — find the bare core' },
}

export default function LearnSection({ onDemo }: { onDemo: (faces: number) => void }) {
  return (
    <section className="mt-8" aria-label="understand the math">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-100">
            <Box className="h-5 w-5 text-orange-400" /> Understand the math behind it
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Four families of cubes, four formulas — each one is just a shape count. Hit “Show in 3D” to see it happen above.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <Card key={cat.faces} className="border-slate-800 bg-slate-900/50 transition-colors hover:border-slate-600">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-4 w-4 rounded-[5px] border" style={{ background: cat.hex + '2E', borderColor: cat.hex }}>
                  <span className="block h-full w-full scale-[0.55] rounded-[3px]" style={{ background: cat.hex }} />
                </span>
                <h3 className="text-[15px] font-black text-slate-100">{cat.name}</h3>
              </div>
              <div className="font-mono text-2xl font-black tracking-tight" style={{ color: cat.hex }}>
                {cat.formula}
              </div>
              <p className="flex-1 text-xs leading-relaxed text-slate-400">{cat.desc}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800"
                onClick={() => onDemo(cat.faces)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" style={{ color: cat.hex }} /> Show in 3D — {DEMOS[cat.faces].hint}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-slate-900/40 to-slate-900/10 px-6 py-5">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-orange-300">The golden identity</h3>
            <p className="mt-1 text-sm text-slate-300">
              The four piles always rebuild the big cube — nothing lost, nothing doubled.
            </p>
          </div>
          <div className="font-mono text-lg font-black text-slate-100 md:text-xl">
            8 + 12(n−2) + 6(n−2)² + (n−2)³ <span className="text-orange-400">= n³</span>
          </div>
        </div>
      </div>
    </section>
  )
}
