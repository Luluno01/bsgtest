import assert from "assert"

export function rand(lower: number, upper: number) {
  const size = upper - lower
  return Math.random() * size + lower
}

export function randInt(lower: number, upper: number) {
  return Math.floor(rand(lower, upper))
}

// Reservoir sampling
export function sample<T>(src: T[], k: number): T[] {
  assert(src.length >= k, 'Population is too small for sampling')
  const res = src.slice(0, k)
  let i = k
  for (const elem of src.slice(k)) {
    const j = randInt(0, i + 1)
    if (j < k) {
      res[j] = elem
    }
    i++
  }
  return res
}
