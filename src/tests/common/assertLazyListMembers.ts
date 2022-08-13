import assert from 'assert'
import Bot from '../../Bot'
import BungeeCord from '../../BungeeCord'
import List from '../../List'
import print from '../../print'


export async function assertLazyListMembers(bc: BungeeCord, listName: string, expectedMembers: Set<Bot>) {
  print('Verifying if the bots are in the', listName)
  const list = new List
  const [ dumpedLazyList, _ ] = await list.get(bc, listName)
  assert.strictEqual(dumpedLazyList.length, expectedMembers.size,
    `Expecting all bots to be added, but got the list: ${dumpedLazyList}`)
  for (const expectedBot of expectedMembers) {
    assert.notStrictEqual(dumpedLazyList.indexOf(expectedBot.username), -1,
      `${expectedBot.username} (${expectedBot.offlineId}) is missing from the list: ${dumpedLazyList}`)
  }
}

export default assertLazyListMembers
