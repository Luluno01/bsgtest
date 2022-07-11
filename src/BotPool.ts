import EventBarrier from '@unlib-js/event-barrier'
import assert from 'assert'
import Bot from './Bot'
import BungeeCord from './BungeeCord'


export class OutOfBotError extends Error {}

export class BotPool {
  protected bc: BungeeCord
  protected get host() {
    return this.bc.host
  }
  protected get port() {
    return this.bc.port
  }
  public readonly pool: Map<Bot, boolean> = new Map
  public minSize: number
  public maxSize: number
  protected eb = new EventBarrier

  constructor(bc: BungeeCord, minSize = 10, maxSize = 100) {
    assert(minSize >= 0)
    assert(minSize <= maxSize)
    this.eb.setMaxListeners(maxSize)
    this.bc = bc
    this.maxSize = maxSize
    this.minSize = minSize
  }

  protected _new(factory: () => Bot) {
    const { pool } = this
    const bot = factory()
    pool.set(bot, true)
    return bot
  }

  public new(factory: () => Bot) {
    const { pool, maxSize } = this
    assert(pool.size < maxSize, `Max pool size (${maxSize}) reached`)
    return this._new(factory)
  }

  protected _replace(bot: Bot, factory: () => Bot) {
    const { pool } = this
    assert(pool.has(bot), `Bot (${bot.username}) is not in the pool`)
    const newBot = factory()
    pool.set(newBot, true)
    return newBot
  }

  /**
   * Get a bot from the pool
   * @param factory bot factory
   * @param criteria bot criteria, e.g., must be connected, etc.
   * @returns 
   */
  public get(factory: () => Bot, criteria: (bot: Bot) => boolean) {
    const { pool, minSize, maxSize } = this
    if (pool.size < minSize) {
      // Create a new one anyway
      return this._new(factory)
    }
    // Try to reuse
    for (const [ mBot, inUse ] of pool) {
      if (!inUse && criteria(mBot)) {
        pool.set(mBot, true)
        return mBot
      }
    }
    // Try to create a new one
    if (pool.size < maxSize) {
      // Create a new one
      return this._new(factory)
    }
    throw new OutOfBotError(`All ${maxSize} bot(s) busy`)
  }

  /**
   * Mark the bot as available to be reused
   * @param bot the bot to release
   */
  public put(bot: Bot) {
    const { pool, eb, minSize } = this
    assert(pool.has(bot), `Bot (${bot.username}) is not in this pool`)
    if (eb.listenerCount('bot-available')) {
      eb.notify('bot-available', bot, 1)  // Wake up 1 lucky dude (FIFO, actually)
    } else if (pool.size > minSize) {
      // No one really cares, remove it but keep at least `minSize` bots
      pool.delete(bot)
    } else {
      // No one is waiting for a bot, and the pool size is small enough - keep the bot
      pool.set(bot, false)  // Mark as not in use
    }
  }

  /**
   * Get a bot or wait for a slot to become available
   * @param factory bot factory
   * @param criteria bot criteria
   * @returns 
   */
  public async getOrWait(factory: () => Bot, criteria: (bot: Bot) => boolean) {
    try {
      const bot = this.get(factory, criteria)
      return bot
    } catch {
      const { eb } = this
      const bot = await eb.waitFor<Bot>('bot-available')
      if (criteria(bot)) {
        return bot
      }
      // Not what we want, just replace it with a new one
      const newBot = this._replace(bot, factory)
      return newBot
    }
  }
}

export default BotPool
