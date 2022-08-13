import Bot from '../../Bot'
import BotPool from '../../BotPool'
import { randInt } from '../../helpers/rand'
import { dummyFactory, isBotStartable } from './common'
import testOneBot, { assertBlacklisted, assertLoggedIn, assertNotWhitelisted } from './testOneBot'


export async function testWhitelistBlacklistOnce(
  whitelist: BotPool,
  blacklist: BotPool,
  overlapped: BotPool,
  freeBots: BotPool
) {
  const action: [ BotPool, (bot: Bot, reason: string | Error, loggedIn: boolean) => void ][] = [
    [ whitelist, assertLoggedIn ],
    [ blacklist, assertBlacklisted ],
    [ overlapped, assertBlacklisted ],
    [ freeBots, assertNotWhitelisted ]
  ]
  const [ pool, assertResult ] = action[randInt(0, 4 + 1)]
  const bot = await pool.getOrWait(dummyFactory, isBotStartable)
  const res = await testOneBot(bot, assertResult)
  pool.put(bot)
  return res
}
