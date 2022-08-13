import BotPool from '../../BotPool'
import { dummyFactory, isBotStartable } from './common'
import testOneBot, { assertBlacklisted, assertLoggedIn, assertNotWhitelisted } from './testOneBot'


export async function testBlacklistOnce(blacklisted: BotPool, freeBots: BotPool, whitelistEnabled = false) {
  if (Math.random() < 0.5) {
    const bot = await blacklisted.getOrWait(dummyFactory, isBotStartable)
    const res = await testOneBot(bot, assertBlacklisted)
    blacklisted.put(bot)
    return res
  } else {
    const bot = await freeBots.getOrWait(dummyFactory, isBotStartable)
    const res = await testOneBot(bot, whitelistEnabled ? assertNotWhitelisted : assertLoggedIn)
    freeBots.put(bot)
    return res
  }
}

export default testBlacklistOnce
