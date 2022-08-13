export class Stat {
  constructor(protected name: string) {}
  public toString() {
    return this.name
  }
}

export class Stats extends Map<string | Stat, number> {
  public inc(key: string | Stat) {
    this.set(key, this.get(key) + 1)
  }

  public incBy(key: string | Stat, n: number) {
    this.set(key, this.get(key) + n)
  }

  public override get(key: string | Stat): number {
    return super.get(key) ?? 0
  }

  public forPrint(): Map<string, number> {
    const entries = Array.from(this.entries())
      .map(([ stat, count ]) => [ stat.toString(), count ] as [ string, number ])
      .sort((a, b) => a[0] > b[0] ? 1 : -1)
    return new Map(entries)
  }
}

export default new Stats

export class LocalStats extends Stats {
  constructor(protected readonly parent: Stats, ...args: ConstructorParameters<typeof Stats>) {
    super(...args)
  }

  public override inc(key: string | Stat) {
    super.inc(key)
    this.parent.inc(key)
  }

  public override incBy(key: string | Stat, n: number) {
    super.incBy(key, n)
    this.parent.incBy(key, n)
  }
}
