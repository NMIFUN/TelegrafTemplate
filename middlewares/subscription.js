const config = require('../config')
const Markup = require('telegraf/markup')

module.exports = async (ctx, next) => {
  for (const channel of config.subsChannels) {
    const check = await ctx.telegram.getChatMember(channel.id, ctx.from.id).catch(() => {}) || {}
    if(['left', 'kicked'].includes(check.status)) return ctx[ctx.updateType === 'message' ? 'replyWithHTML' : 'editMessageText'](ctx.i18n.t('subscribe.text', { 
      channels: config.subsChannels.map(element => `<a href="${element.link}">${element.title}</a>`).join(', ')
    }), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        ...config.subsChannels.map(element => Markup.urlButton(element.title, element.link)),
        Markup.callbackButton(ctx.i18n.t('subscribe.key.check'), `subscription`)
      ], { columns: 1 }),
      disable_web_page_preview: true
    })
  }

  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    return ctx.editMessageText(ctx.i18n.t('subscribe.success'))
  }

  return next()
}