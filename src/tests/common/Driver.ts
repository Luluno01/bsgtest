import { setTimeout } from 'timers/promises'
import Bot from '../../Bot'
import Context from './Context'
import ListAction from './ListAction'
import print from '../../print'
import testOneBot from '../../tests/common/testOneBot'
import Command from '../../Command'
import List from '../../List'
import stats, { Stat } from './Stats'
import assert from 'assert'
import { botStats } from './botStats'


export type Ticker = (driver: Driver) => void

export class Driver {
  protected wlistAddQueue: ListAction
  protected wlistRmQueue: ListAction
  protected wlistLAddQueue: ListAction
  protected wlistLRmQueue: ListAction
  protected blistAddQueue: ListAction
  protected blistRmQueue: ListAction
  protected blistLAddQueue: ListAction
  protected blistLRmQueue: ListAction
  protected joinQueue: Set<Bot> = new Set
  protected switchWList: boolean | null = false
  protected switchBList: boolean | null = false
  protected restarting: boolean = false
  constructor(protected ctx: Context,
    protected botTicks: Ticker[], protected throttle: number,
    protected periodicTicks: Ticker[], protected period: number) {
    this.wlistAddQueue = new ListAction(ctx, 'wlist add',
      bot => bot.offlineId, bot => ctx.lists.whitelist.add(bot.offlineId),
      ctx.lists.lorWListAdd)
    this.wlistRmQueue = new ListAction(ctx, 'wlist rm',
      bot => bot.offlineId, bot => ctx.lists.whitelist.delete(bot.offlineId),
      ctx.lists.lorWListRm)
    this.wlistLAddQueue = new ListAction(ctx, 'wlist ladd',
      bot => bot.username, bot => ctx.lists.lazyWhitelist.add(bot.username),
      ctx.lists.lorWListLAdd)
    this.wlistLRmQueue = new ListAction(ctx, 'wlist lrm',
      bot => bot.username, bot => ctx.lists.lazyWhitelist.delete(bot.username),
      ctx.lists.lorWListLRm)
    this.blistAddQueue = new ListAction(ctx, 'blist add',
      bot => bot.offlineId, bot => ctx.lists.blacklist.add(bot.offlineId),
      ctx.lists.lorBListAdd)
    this.blistRmQueue = new ListAction(ctx, 'blist rm',
      bot => bot.offlineId, bot => ctx.lists.blacklist.delete(bot.offlineId),
      ctx.lists.lorBListRm)
    this.blistLAddQueue = new ListAction(ctx, 'blist ladd',
      bot => bot.username, bot => ctx.lists.lazyBlacklist.add(bot.username),
      ctx.lists.lorBListLAdd)
    this.blistLRmQueue = new ListAction(ctx, 'blist lrm',
      bot => bot.username, bot => ctx.lists.lazyBlacklist.delete(bot.username),
      ctx.lists.lorBListLRm)
  }

  public async run(maxIters: number = Infinity, endSignal?: AbortSignal) {
    const { ctx: { rand }, period } = this
    let iters = 0
    while (!endSignal?.aborted && iters < maxIters) {
      stats.inc('tick')
      print('Executing iteration', iters + 1)
      if (iters % period == 0) {
        this.periodTick()
      }
      if (iters % 10 == 0) await this.assertLists()
      await this.switchLists()
      this.tick()
      await this._run(endSignal)
      await setTimeout(rand.integer({ min: 10, max: 200 }))
      iters++
    }
    await this.assertLists()
    return iters
  }

  protected assertList(name: string,
    actual: [ string[], string[] ],
    wantedLazy: Set<string>, wantedMain: Set<string>) {
    const [ lazy, main ] = actual
    assert.strictEqual(lazy.length, wantedLazy.size,
      `Lazy ${name} has the wrong size; expected=${Array.from(wantedLazy).join(',')}, got=${lazy.join(', ')}`)
    for (const who of lazy) {
      if (!wantedLazy.has(who)) {
        print(`Trace of ${who}: ${this.ctx.bots.forName(who)?.trace}`)
        assert.fail(`Lazy ${name} is missing ${who}`)
      }
    }
    assert.strictEqual(main.length, wantedMain.size,
      `Main ${name} has the wrong size; expected=${Array.from(wantedMain).join(',')}, got=${main.join(', ')}`)
    for (const who of main) {
      if (!wantedMain.has(who)) {
        print(`Trace of ${who}: ${this.ctx.bots.forId(who)?.trace}`)
        assert.fail(`Main ${name} is missing ${who}`)
      }
    }
  }

  protected async assertLists() {
    print('Checking list records')
    stats.inc('assertLists')
    const { ctx: { bc, lists } } = this
    const list = new List
    const wlist = await list.get(bc, 'wlist')
    this.assertList('whitelist', wlist, lists.lazyWhitelist, lists.whitelist)
    const blist = await list.get(bc, 'blist')
    this.assertList('blacklist', blist, lists.lazyBlacklist, lists.blacklist)
  }

  protected async switchLists() {
    const { ctx: { bc, lists }, switchWList, switchBList } = this
    let rawCmd = ''
    let lor = 0
    if (switchWList !== null) {
      const srcState = lists.whitelistEnabled ? 'on' : 'off'
      const dstState = switchWList ? 'on' : 'off'
      print('Turning', dstState, 'the whitelist')
      rawCmd += `wlist ${dstState}\n`
      lor++
      this.switchWList = null
      lists.whitelistEnabled = switchWList
      stats.inc(`wlist:${srcState}=>${dstState}`)
    }
    if (switchBList !== null) {
      const srcState = lists.blacklistEnabled ? 'on' : 'off'
      const dstState = switchBList ? 'on' : 'off'
      print('Turning', dstState, 'the blacklist')
      rawCmd += `blist ${dstState}\n`
      lor++
      this.switchBList = null
      lists.blacklistEnabled = switchBList
      stats.inc(`blist:${srcState}=>${dstState}`)
    }
    if (rawCmd) {
      const cmd = new Command(rawCmd, bc)
      await cmd.exec(lor, { timeout: lor * 1000 })
    }
  }

  protected tick() {
    const { ctx: { rand }, botTicks, throttle } = this
    for (const botTick of rand.pickset(botTicks, throttle)) {
      botTick(this)
    }
  }

  protected periodTick() {
    const { periodicTicks } = this
    for (const tick of periodicTicks) {
      tick(this)
    }
  }

  protected async _run(_?: AbortSignal) {
    const {
      ctx,
      wlistAddQueue,
      wlistRmQueue,
      wlistLAddQueue,
      wlistLRmQueue,
      blistAddQueue,
      blistRmQueue,
      blistLAddQueue,
      blistLRmQueue,
      joinQueue,
      restarting
    } = this
    await wlistAddQueue.exec()
    await wlistRmQueue.exec()
    await wlistLAddQueue.exec()
    await wlistLRmQueue.exec()
    await blistAddQueue.exec()
    await blistRmQueue.exec()
    await blistLAddQueue.exec()
    await blistLRmQueue.exec()
    const jobs: Promise<void>[] = []
    const { lists } = ctx
    for (const bot of joinQueue) {
      jobs.push((async () => {
        const desc = lists.describe(bot.username, bot.offlineId)
        print(`[${bot.username}] Shadow state:`, desc)
        bot.addTrace(['join', desc ])
        stats.inc(botStats[lists.signatureCode(bot.username, bot.offlineId)])
        await testOneBot(bot, lists.getAssert(bot.username, bot.offlineId))
      })())
    }
    await Promise.all(jobs)
    if (restarting) {
      this.restarting = false
      stats.inc('restart')
      await ctx.bc.restart()
      await this.assertLists()
    }
  }

  public wlistAdd(bot: Bot) {
    this.wlistAddQueue.enqueue(bot)
  }

  public wlistRm(bot: Bot) {
    this.wlistRmQueue.enqueue(bot)
  }

  public wlistLAdd(bot: Bot) {
    this.wlistLAddQueue.enqueue(bot)
  }

  public wlistLRm(bot: Bot) {
    this.wlistLRmQueue.enqueue(bot)
  }

  public blistAdd(bot: Bot) {
    this.blistAddQueue.enqueue(bot)
  }

  public blistRm(bot: Bot) {
    this.blistRmQueue.enqueue(bot)
  }

  public blistLAdd(bot: Bot) {
    this.blistLAddQueue.enqueue(bot)
  }

  public blistLRm(bot: Bot) {
    this.blistLRmQueue.enqueue(bot)
  }

  public join(bot: Bot) {
    this.joinQueue.add(bot)
  }

  public wlistOn() {
    this.switchWList = true
  }

  public wlistOff() {
    this.switchWList = false
  }

  public blistOn() {
    this.switchBList = true
  }

  public blistOff() {
    this.switchBList = false
  }

  public restart() {
    this.restarting = true
  }
}

export default Driver
