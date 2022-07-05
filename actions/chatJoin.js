const config = require('../config')

module.exports = async (ctx) => {
  const find = config.joinChannels?.find(channel => channel.id === ctx.chat.id)
  if(!find) return

  return ctx.telegram.sendMessage(ctx.from.id, ctx.i18n.t('joinRequest.text'), { parse_mode: "HTML" })
}