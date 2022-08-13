import Bot from '../../Bot'
import BotPool from '../../BotPool'
import testBlacklistOnce from './testBlacklistOnce'
import testOneBot, { assertBlacklisted } from './testOneBot'


export async function testLazyBlacklistOnce(lazyBlacklisted: Bot[], blacklisted: BotPool, freeBots: BotPool, whitelistEnabled = false) {
  if (lazyBlacklisted.length && Math.random() < 0.6 || !blacklisted.size) {
    const bot = lazyBlacklisted.shift()!
    const res = await testOneBot(bot, assertBlacklisted)
    blacklisted.import([ bot ])  // Update the list only after the test is done because this will "put" the bot
    return res
  }
  return testBlacklistOnce(blacklisted, freeBots, whitelistEnabled)
}

export default testLazyBlacklistOnce
