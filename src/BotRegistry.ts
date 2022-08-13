import Bot from './Bot'
import { BotFactory } from './BotFactory'


export class BotRegistry {
  // Username => Bot
  protected bots: Map<string, Bot> = new Map
  protected idToBot: Map<string, Bot> = new Map
  constructor(protected factory: BotFactory) {}
  public new() {
    const bot = this.factory.get()
    this.bots.set(bot.username, bot)
    this.idToBot.set(bot.offlineId, bot)
    return bot
  }

  public forName(username: string) {
    return this.bots.get(username)
  }

  public forId(id: string) {
    return this.idToBot.get(id)
  }
}

export default BotRegistry
