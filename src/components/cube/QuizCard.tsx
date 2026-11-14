'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Flame, Trophy, XCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { CATEGORIES, categoryOf, countsFor } from '@/lib/cube'

interface Q {
  n: number
  faces: 3 | 2 | 1 | 0
}

function makeQuestion(): Q {
  const n = 3 + Math.floor(Math.random() * 6) // 3..8
  const faces = CATEGORIES[Math.floor(Math.random() * 4)].faces
  return { n, faces }
}

function substitution(n: number, faces: number): string {
  switch (faces) {
    case 3:
      return 'corners are fixed: always 8'
    case 2:
      return `12(n − 2) = 12 × ${n - 2}`
    case 1:
      return `6(n − 2)² = 6 × ${n - 2}²`
    default:
      return `(n − 2)³ = ${n - 2}³`
  }
}

// fixed first question keeps SSR and client markup identical (Math.random would break hydration)
const FIRST_QUESTION: Q = { n: 4, faces: 2 }

export default function QuizCard() {
  const [q, setQ] = useState<Q>(FIRST_QUESTION)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState<null | { correct: boolean }>(null)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)

  const counts = useMemo(() => countsFor(q.n), [q.n])
  const answer = counts[q.faces]

  const check = () => {
    if (value.trim() === '' || checked) return
    const correct = Number(value) === answer
    setChecked({ correct })
    if (correct) {
      setStreak((s) => {
        const ns = s + 1
        setBest((b) => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
    }
  }

  const next = () => {
    setQ(makeQuestion())
    setValue('')
    setChecked(null)
  }

  return (
    <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-200">
            <Trophy className="h-4 w-4 text-amber-400" /> CHALLENGE YOURSELF
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 font-bold text-amber-300">
              <Flame className="h-3 w-3" /> {streak}
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-400">best {best}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-[13px] leading-relaxed text-slate-300">
              A cube is painted on all 6 faces, then cut into{' '}
              <b className="text-slate-100">
                {q.n} × {q.n} × {q.n} = {q.n ** 3}
              </b>{' '}
              equal cubes. How many small cubes have <b style={{ color: categoryOf(q.faces).hex }}>exactly {q.faces} painted face{q.faces === 1 ? '' : 's'}</b>?
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (checked ? next() : check())}
                placeholder="your answer"
                disabled={!!checked}
                className="border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-600"
                aria-label="your answer"
              />
              {checked ? (
                <Button onClick={next} className="bg-orange-600 font-bold hover:bg-orange-500">
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={check} disabled={value.trim() === ''} className="bg-teal-600 font-bold hover:bg-teal-500">
                  Check
                </Button>
              )}
            </div>

        {checked && (
            <div
              className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
                checked.correct ? 'border-teal-500/50 bg-teal-500/10 text-teal-200' : 'border-rose-500/50 bg-rose-500/10 text-rose-200'
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 font-black">
                {checked.correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {checked.correct ? 'Correct!' : `Not quite — the answer is ${answer}.`}
              </div>
              <span className="font-mono text-[11px]">
                {substitution(q.n, q.faces)} = {answer} · verify: 8 + 12({q.n}−2) + 6({q.n}−2)² + ({q.n}−2)³ = {q.n ** 3}
              </span>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
