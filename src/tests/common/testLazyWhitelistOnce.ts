import Bot from '../../Bot'
import BotPool from '../../BotPool'
import testOneBot, { assertLoggedIn } from './testOneBot'
import testWhitelistOnce from './testWhitelistOnce'


export async function testLazyWhitelistOnce(lazyWhitelisted: Bot[], whitelisted: BotPool, freeBots: BotPool) {
  if (lazyWhitelisted.length && Math.random() < 0.6 || !whitelisted.size) {
    const bot = lazyWhitelisted.shift()!
    const res = await testOneBot(bot, assertLoggedIn)
    whitelisted.import([ bot ])  // Update the list only after the test is done because this will "put" the bot
    return res
  }
  return testWhitelistOnce(whitelisted, freeBots)
}

export default testLazyWhitelistOnce
