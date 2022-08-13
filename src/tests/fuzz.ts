import Bot from '../Bot'
import print from '../print'
import Driver, { Ticker } from './common/Driver'
import Command from '../Command'
import Context from './common/Context'
import LifeCycle, { TickOpDef } from './common/LifeCycle'


export const name = 'fuzz'

export const expected = 'CRUD operations take immediate effect and persist across restarts;' +
  'contents of the lists are always as expected'

class BotCycle extends LifeCycle {
  constructor(rand: Chance.Chance, bot: Bot) {
    super(rand, new Map<string, TickOpDef>([
      // These `dec`s are kind of useless for now because they are never `inc`-ed
      [ 'wlistAdd', {
        tick: BotCycle.createBotTick(Driver.prototype.wlistAdd, bot),
        inc: [ 'join', 'join' ], dec: [ 'wlistRm' ]
      } ],
      [ 'wlistRm', {
        tick: BotCycle.createBotTick(Driver.prototype.wlistRm, bot),
        inc: [ 'join' ], dec: [ 'wlistAdd' ]
      } ],
      [ 'wlistLAdd', {
        tick: BotCycle.createBotTick(Driver.prototype.wlistLAdd, bot),
        inc: [ 'join', 'join' ], dec: [ 'wlistLRm' ]
      } ],
      [ 'wlistLRm', {
        tick: BotCycle.createBotTick(Driver.prototype.wlistLRm, bot),
        inc: [ 'join' ],
      } ],
      [ 'blistAdd', {
        tick: BotCycle.createBotTick(Driver.prototype.blistAdd, bot),
        inc: [ 'join', 'join' ], dec: [ 'blistRm' ]
      } ],
      [ 'blistRm', {
        tick: BotCycle.createBotTick(Driver.prototype.blistRm, bot),
        inc: [ 'join' ], dec: [ 'blistAdd' ]
      } ],
      [ 'blistLAdd', {
        tick: BotCycle.createBotTick(Driver.prototype.blistLAdd, bot),
        inc: [ 'join', 'join' ], dec: [ 'wlistLRm' ]
      } ],
      [ 'blistLRm', {
        tick: BotCycle.createBotTick(Driver.prototype.blistLRm, bot),
        inc: [ 'join' ],
      } ],
      [ 'join', {
        tick: BotCycle.createBotTick(Driver.prototype.join, bot),
        reset: true
      } ],
    ]))
  }

  protected static createBotTick(driverOp: (bot: Bot) => void, bot: Bot) {
    return (driver: Driver) => driverOp.call(driver, bot)
  }
}

class ListCycle extends LifeCycle {
  constructor(rand: Chance.Chance) {
    super(rand, new Map<string, TickOpDef>([
      [ 'wlistOn', {
        tick: driver => driver.wlistOn(),
        set: [ 'wlistOn' ],
        inc: [ 'wlistOff' ]
      } ],
      [ 'wlistOff', {
        tick: driver => driver.wlistOff(),
        set: [ 'wlistOff' ],
        inc: [ 'wlistOn' ]
      } ],
      [ 'blistOn', {
        tick: driver => driver.blistOn(),
        set: [ 'blistOn' ],
        inc: [ 'blistOff' ]
      } ],
      [ 'blistOff', {
        tick: driver => driver.blistOff(),
        set: [ 'blistOff' ],
        inc: [ 'blistOn' ]
      } ],
      [ 'restart', {
        tick: driver => driver.restart(),
        reset: true
      } ]
    ]), 5, 1)
    this.weighted.set(this.defs.get('restart')!, 2)
  }
}

export async function test({ rand, bc, lists, bots }: Context) {
  const ticks: Ticker[] = []
  const nBots = 50
  const throttle = 10
  print('Using', nBots, 'bots, max concurrency:', throttle)
  for (let i = 0; i < nBots; i++) {
    const bot = bots.new()
    const botCycle = new BotCycle(rand, bot)
    ticks.push(botCycle.tick.bind(botCycle))
  }
  const listCycle = new ListCycle(rand)
  const driver = new Driver({ rand, bc, lists, bots }, ticks, throttle, [ listCycle.tick.bind(listCycle) ], 3)
  const iters = await driver.run(100)
  print(iters, 'iters done')
  print('Clearing the lists')
  for (const who of lists.whitelist) {
    const cmd = new Command(`wlist rm ${who}\n`, bc)
    await cmd.exec(1)
  }
  for (const who of lists.lazyWhitelist) {
    const cmd = new Command(`wlist lrm ${who}\n`, bc)
    await cmd.exec(1)
  }
  for (const who of lists.blacklist) {
    const cmd = new Command(`blist rm ${who}\n`, bc)
    await cmd.exec(1)
  }
  for (const who of lists.lazyBlacklist) {
    const cmd = new Command(`blist lrm ${who}\n`, bc)
    await cmd.exec(1)
  }
}
