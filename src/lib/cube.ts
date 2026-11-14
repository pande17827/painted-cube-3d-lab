// ── Painted Cube core math & metadata ────────────────────────────────────────
export interface CubeSel {
  x: number
  y: number
  z: number
  count: number
}

export type FaceFlags = {
  px: boolean
  nx: boolean
  py: boolean
  ny: boolean
  pz: boolean
  nz: boolean
}

/** Which faces of the small cube (x,y,z) lie on the big cube's surface. */
export function facePainted(x: number, y: number, z: number, n: number): FaceFlags {
  return {
    px: x === n - 1,
    nx: x === 0,
    py: y === n - 1,
    ny: y === 0,
    pz: z === n - 1,
    nz: z === 0,
  }
}

/** How many faces of this small cube are painted (0-3). */
export function paintedCountOf(x: number, y: number, z: number, n: number): number {
  const f = facePainted(x, y, z, n)
  return [f.px, f.nx, f.py, f.ny, f.pz, f.nz].filter(Boolean).length
}

export interface Category {
  faces: 3 | 2 | 1 | 0
  name: string
  place: string
  hex: string
  formula: string
  desc: string
}

export const CATEGORIES: Category[] = [
  {
    faces: 3,
    name: '3 painted faces',
    place: 'Corners',
    hex: '#FB923C',
    formula: '8',
    desc: 'One at every corner of the big cube — three of their faces carry paint. A cube has exactly 8 corners, so this count never changes.',
  },
  {
    faces: 2,
    name: '2 painted faces',
    place: 'Edges',
    hex: '#2DD4BF',
    formula: '12(n − 2)',
    desc: 'Sit along the 12 edges, between the corner pieces. Each edge keeps its n − 2 middle pieces.',
  },
  {
    faces: 1,
    name: '1 painted face',
    place: 'Face centres',
    hex: '#A3E635',
    formula: '6(n − 2)²',
    desc: 'In the middle block of each of the 6 faces: an (n − 2) × (n − 2) sheet per face.',
  },
  {
    faces: 0,
    name: '0 painted faces',
    place: 'Hidden core',
    hex: '#94A3B8',
    formula: '(n − 2)³',
    desc: 'Sealed inside, invisible from outside. They form a smaller cube of side n − 2.',
  },
]

export const categoryOf = (count: number): Category =>
  CATEGORIES.find((c) => c.faces === count) ?? CATEGORIES[3]

/** Live counts for a given n. */
export function countsFor(n: number): Record<number, number> & { total: number } {
  return {
    3: 8,
    2: 12 * (n - 2),
    1: 6 * (n - 2) ** 2,
    0: (n - 2) ** 3,
    total: n ** 3,
  }
}

/** One example cube of each category, used for floating 3D labels. */
export function exampleCoordFor(faces: number, n: number): CubeSel | null {
  if (n < 2) return null
  const mid = Math.floor(n / 2)
  switch (faces) {
    case 3:
      return { x: n - 1, y: n - 1, z: n - 1, count: 3 }
    case 2:
      return n >= 3 ? { x: n - 1, y: n - 1, z: mid, count: 2 } : null
    case 1:
      return n >= 3 ? { x: Math.floor((n - 1) / 2), y: n - 1, z: Math.floor((n - 1) / 2), count: 1 } : null
    case 0:
      return n >= 3 ? { x: mid, y: mid, z: mid, count: 0 } : null
    default:
      return null
  }
}

export const FACE_LABELS: Record<keyof FaceFlags, string> = {
  py: 'Top',
  ny: 'Bottom',
  px: 'Right',
  nx: 'Left',
  pz: 'Front',
  nz: 'Back',
}
