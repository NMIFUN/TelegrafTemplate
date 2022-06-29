const config = require('../config')

module.exports = async (ctx) => {
  const find = config.joinChannels.find(channel => channel.id === ctx.chat.id)
  if(!find) return

  return ctx.replyWithHTML(ctx.i18n.t('joinRequest.text'))
}