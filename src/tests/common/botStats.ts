import { Stat } from './Stats'


export class BotStat extends Stat {
  constructor(
    public readonly signature: string,
    public readonly code: number
  ) {
    super(`join:${signature}`)
  }

  public get wlistOn() {
    return this.code & 0b100_000
  }

  public get inWList() {
    return this.code & 0b010_000
  }

  public get inLWList() {
    return this.code & 0b001_000
  }

  public get blistOn() {
    return this.code & 0b000_100
  }

  public get inBList() {
    return this.code & 0b000_010
  }

  public get inLBList() {
    return this.code & 0b000_001
  }
}

export const botStats: BotStat[] = []

// w00b00: 2^6 = 64
for (let i = 0; i < 64; i++) {
  const wlistOn = (i & 0b100_000) ? 'W' : 'w'
  const blistOn = (i & 0b000_100) ? 'B' : 'b'
  const bin = i.toString(2).padStart(6, '0')
  botStats.push(new BotStat(
    `${wlistOn}${bin.substring(1, 3)}${blistOn}${bin.substring(4, 6)}`,
    i
  ))
}
