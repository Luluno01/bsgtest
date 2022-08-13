import assert from 'assert'
import Bot from '../../Bot'
import BungeeCord from '../../BungeeCord'
import List from '../../List'
import print from '../../print'


export async function assertListMembers(bc: BungeeCord, listName: string, expectedMembers: Set<Bot>) {
  print('Verifying if the bots are in the', listName)
  const list = new List
  const [ _, dumpedMainList ] = await list.get(bc, listName)
  assert.strictEqual(dumpedMainList.length, expectedMembers.size,
    `Expecting all bots to be added, but got the list: ${dumpedMainList}`)
  for (const expectedBot of expectedMembers) {
    assert.notStrictEqual(dumpedMainList.indexOf(expectedBot.offlineId), -1,
      `${expectedBot.username} (${expectedBot.offlineId}) is missing from the list: ${dumpedMainList}`)
  }
}

export default assertListMembers
