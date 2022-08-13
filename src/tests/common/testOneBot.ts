import assert from 'assert'
import Bot, { ChangeToDisconnected } from '../../Bot'
import print from '../../print'
import stats from './Stats'


async function testOneBot(
  bot: Bot,
  assertResult: (bot: Bot, reason: string | Error, loggedIn: boolean) => void): Promise<boolean> {
  print(`[${bot.username}] Connecting /`, assertResult.name)
  try {
    await bot.start()
  } catch (err) {
    print(`[${bot.username}] Screwed up when starting`)
    print(`[${bot.username}] State:`, bot.state)
    throw err
  }
  let stateChange: ChangeToDisconnected
  try {
    stateChange = (await bot.waitForState<ChangeToDisconnected>('disconnected', 5000))!
    print(`[${bot.username}] Disconnected`)
  } catch (err) {
    const code = (<Error & { code?: string }>err).code
    if (code == 'ECONNABORTED' || code == 'ECONNRESET') {
      print('Warning:', bot.username, `was disconnected with "${code}"`)
      return false
    } else {
      print(`[${bot.username}] Failed`)
      throw err
    }
  }
  const { reason: [ { cause: [ reason, loggedIn ] } ] } = stateChange
  if (reason == 'socketClosed') {
    print('Warning:', bot.username, 'was disconnected with "socketClosed"')
    return false
  } else if (reason instanceof Error) {
    print('Warning:', bot.username, 'was disconnected with an error object:', reason)
  }
  assertResult(bot, reason, loggedIn)
  return true
}

export default testOneBot

export function assertLoggedIn(bot: Bot, reason: string | Error, loggedIn: boolean) {
  if (!loggedIn) {
    print(`Trace of ${bot.username}: ${bot.trace}`)
    assert.fail(`${bot.username} login failed, reason: ${reason}`)
  }
  if (!(typeof reason == 'string' && reason.includes('Could not connect to a default or fallback server.'))) {
    print(`Trace of ${bot.username}: ${bot.trace}`)
    assert.fail(`${bot.username} was disconnect with unexpected reason: ${reason}`)
  }
  stats.inc('loggedIn')
}

export function assertNotWhitelisted(bot: Bot, reason: string | Error, loggedIn: boolean) {
  if (loggedIn) {
    print(`Trace of ${bot.username}: ${bot.trace}`)
    assert.fail(`${bot.username} was not blocked, and then disconnected with the reason: ${reason}`)
  }
  if (!(typeof reason == 'string' && reason.includes(':( You are not whitelisted on this server'))) {
    print(`Trace of ${bot.username}: ${bot.trace}`)
    assert.fail(`${bot.username} was disconnected with unexpected reason: ${reason}`)
  }
  stats.inc('notWhitelisted')
}

export function assertBlacklisted(bot: Bot, reason: string | Error, loggedIn: boolean) {
  if (loggedIn) {
    print(`Trace of ${bot.username}: ${bot.trace}`)
    assert.fail(`${bot.username} was not blocked, and then disconnected with the reason: ${reason}`)
  }
  if (!(
    typeof reason == 'string' &&
    (
      reason.includes(':( We can\'t let you enter this server') ||
      reason.includes(':( We can\\u0027t let you enter this server')
    ))) {
    print(`Trace of ${bot.username}: ${bot.trace}`)
    assert.fail(`${bot.username} was disconnected with unexpected reason: ${reason}`)
  }
  stats.inc('blacklisted')
}
