import Bot from '../../Bot'
import BotPool from '../../BotPool'
import { randInt } from '../../helpers/rand'
import { dummyFactory, isBotStartable } from './common'
import testBlacklistOnce from './testBlacklistOnce'
import testLazyBlacklistOnce from './testLazyBlacklistOnce'
import testLazyWhitelistOnce from './testLazyWhitelistOnce'
import testOneBot, { assertBlacklisted, assertNotWhitelisted } from './testOneBot'


export async function testLazyWhitelistBlacklistOnce(
  lazyWhitelist: Bot[],
  whitelist: BotPool,
  lazyBlacklist: Bot[],
  blacklist: BotPool,
  lazyOverlapped: Bot[],
  overlapped: BotPool,
  freeBots: BotPool
) {
  switch (randInt(0, 4)) {
    case 0: return testLazyWhitelistOnce(lazyWhitelist, whitelist, freeBots)
    case 1: return testLazyBlacklistOnce(lazyBlacklist, blacklist, freeBots, true)
    case 2:
      if (lazyOverlapped.length && Math.random() < 0.6 || !whitelist.size || !blacklist.size) {
        const bot = lazyOverlapped.shift()!
        const res = await testOneBot(bot, assertBlacklisted)
        // Update the lists only after the test is done because this will "put" the bot
        overlapped.import([ bot ])
        return res
      }
      return testBlacklistOnce(blacklist, freeBots, true)
    case 3:
      const bot = freeBots.get(dummyFactory, isBotStartable)
      const res = await testOneBot(bot, assertNotWhitelisted)
      freeBots.put(bot)
      return res
    default: throw new Error('Impossible')
  }
}

export default testLazyWhitelistBlacklistOnce
