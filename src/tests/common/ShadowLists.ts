import { assertBlacklisted, assertLoggedIn, assertNotWhitelisted } from './testOneBot'


export class ShadowLists {
  public whitelist = new Set<string>()
  public lazyWhitelist = new Set<string>()
  public whitelistEnabled = true
  public blacklist = new Set<string>()
  public lazyBlacklist = new Set<string>()
  public blacklistEnabled = false

  /**
   * Note that this will move the record from lazy list to main list
   */
  public getAssert(username: string, id: string) {
    const {
      whitelist, lazyWhitelist, whitelistEnabled,
      blacklist, lazyBlacklist, blacklistEnabled
    } = this
    if (lazyWhitelist.has(username)) {
      lazyWhitelist.delete(username)
      whitelist.add(id)
    }
    if (lazyBlacklist.has(username)) {
      lazyBlacklist.delete(username)
      blacklist.add(id)
    }
    if (blacklistEnabled && blacklist.has(id)) return assertBlacklisted
    if (whitelistEnabled && !whitelist.has(id)) return assertNotWhitelisted
    return assertLoggedIn
  }

  /**
   * Predict lines of response (LOR) for whitelist add
   * @param id 
   */
  public lorWListAdd(id: string) {
    const { blacklist } = this
    return blacklist.has(id) ? 2 : 1
    /*
    f7885627-7342-3393-ad04-2d1c61c2c414 (f7885627-7342-3393-ad04-2d1c61c2c414) is already in blacklist, whose priority is higher than whitelist
    f7885627-7342-3393-ad04-2d1c61c2c414 (f7885627-7342-3393-ad04-2d1c61c2c414) is already in the whitelist
    */
  }

  /**
   * Predict lines of response (LOR) for blacklist add
   * @param id 
   */
  public lorBListAdd(id: string) {
    const { whitelist } = this
    return whitelist.has(id) ? 2 : 1
  }

  /**
   * Predict lines of response (LOR) for whitelist lazy-add
   * @param username 
   */
  public lorWListLAdd(username: string) {
    const { lazyBlacklist } = this
    return lazyBlacklist.has(username) ? 2 : 1
    /*
    Bot_170 is already in lazy-blacklist, whose priority is higher than whitelist
    Bot_170 is already in the lazy-whitelist
    */
  }

  /**
   * Predict lines of response (LOR) for blacklist lazy-add
   * @param username 
   */
  public lorBListLAdd(username: string) {
    const { lazyWhitelist } = this
    return lazyWhitelist.has(username) ? 2 : 1
  }
  
  public lorWListRm(_: string) {
    return 1
  }
  
  public lorBListRm(_: string) {
    return 1
  }
  
  public lorWListLRm(_: string) {
    return 1
  }
  
  public lorBListLRm(_: string) {
    return 1
  }

  public describe(username: string, id: string) {
    const {
      whitelist, lazyWhitelist, whitelistEnabled,
      blacklist, lazyBlacklist, blacklistEnabled
    } = this
    const wlistName = whitelistEnabled ? [ 'W', 'LW' ] : [ 'w', 'lw' ]
    const blistName = blacklistEnabled ? [ 'B', 'LB' ] : [ 'b', 'lb' ]
    return `${wlistName[0]}=${whitelist.has(id)} ` +
      `${wlistName[1]}=${lazyWhitelist.has(username)} ` +
      `${blistName[0]}=${blacklist.has(id)} ` +
      `${blistName[1]}=${lazyBlacklist.has(username)}`
  }

  public signature(username: string, id: string) {
    const {
      whitelist, lazyWhitelist, whitelistEnabled,
      blacklist, lazyBlacklist, blacklistEnabled
    } = this
    const wlistName = whitelistEnabled ? 'W' : 'w'
    const blistName = blacklistEnabled ? 'B' : 'b'
    return `${wlistName}${whitelist.has(id) ? '1' : '0'}` +
      `${lazyWhitelist.has(username) ? '1' : '0'}` +
      `${blistName}${blacklist.has(id) ? '1' : '0'}` +
      `${lazyBlacklist.has(username) ? '1' : '0'}`
  }

  public signatureCode(username: string, id: string) {
    const {
      whitelist, lazyWhitelist, whitelistEnabled,
      blacklist, lazyBlacklist, blacklistEnabled
    } = this
    let res = 0
    if (whitelistEnabled) res |= 1
    res <<= 1
    if (whitelist.has(id)) res |= 1
    res <<= 1
    if (lazyWhitelist.has(username)) res |= 1
    res <<= 1
    if (blacklistEnabled) res |= 1
    res <<= 1
    if (blacklist.has(id)) res |= 1
    res <<= 1
    if (lazyBlacklist.has(username)) res |= 1
    return res
  }
}

export default ShadowLists
