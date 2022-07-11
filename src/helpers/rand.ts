export function rand(lower: number, upper: number) {
  const size = upper - lower
  return Math.random() * size + lower
}

export function randInt(lower: number, upper: number) {
  return Math.floor(rand(lower, upper))
}
