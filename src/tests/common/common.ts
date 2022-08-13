import Bot from '../../Bot'


export const dummyFactory = () => { throw new Error('Impossible') }
export const isBotStartable = (bot: Bot) => bot.startable
