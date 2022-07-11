import { createHash } from 'crypto'

// https://stackoverflow.com/questions/47505620/javas-uuid-nameuuidfrombytes-to-written-in-javascript

export function nameUUIDFromBytes(name: string) {
  const md5sum = createHash('md5').update(name).digest()
  md5sum[6] &= 0x0f  /* clear version        */
  md5sum[6] |= 0x30  /* set to version 3     */
  md5sum[8] &= 0x3f  /* clear variant        */
  md5sum[8] |= 0x80  /* set to IETF variant  */
  return md5sum
}

export function uuidBufferToString(buff: Buffer) {
  return buff.toString('hex').replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5')
}
