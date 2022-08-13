import BotPool from '../../BotPool'
import { dummyFactory, isBotStartable } from './common'
import testOneBot, { assertLoggedIn, assertNotWhitelisted } from './testOneBot'


export async function testWhitelistOnce(whitelisted: BotPool, freeBots: BotPool) {
  if (Math.random() < 0.5) {
    const bot = await whitelisted.getOrWait(dummyFactory, isBotStartable)
    const res = testOneBot(bot, assertLoggedIn)
    whitelisted.put(bot)
    return res
  } else {
    const bot = await freeBots.getOrWait(dummyFactory, isBotStartable)
    const res = testOneBot(bot, assertNotWhitelisted)
    freeBots.put(bot)
    return res
  }
}

export default testWhitelistOnce
