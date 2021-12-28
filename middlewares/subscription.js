const config = require('../config')
const Markup = require('telegraf/markup')

module.exports = async (ctx, next) => {
  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    for (const channel of config.subsChannels) {
      const check = await ctx.telegram.getChatMember(channel.id, ctx.from.id).catch(() => {}) || {}
      if(['left', 'kicked'].includes(check.status)) return ctx.editMessageText(ctx.i18n.t('subscribe.text', { channel: channel }), {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.urlButton(ctx.i18n.t('subscribe.key.subscribe'), channel.link)],
          [Markup.callbackButton(ctx.i18n.t('subscribe.key.check'), `subscription`)]
        ]),
        disable_web_page_preview: true
      }).catch(() => {})
    }
    return ctx.editMessageText(ctx.i18n.t('subscribe.success'))
  } else {
    for (const channel of config.subsChannels) {
      const check = await ctx.telegram.getChatMember(channel.id, ctx.from.id).catch(() => {}) || {}
      if(['left', 'kicked'].includes(check.status)) return ctx.replyWithHTML(ctx.i18n.t('subscribe.text', { channel: channel }), {
        reply_markup: Markup.inlineKeyboard([
          [Markup.urlButton(ctx.i18n.t('subscribe.key.subscribe'), channel.link)],
          [Markup.callbackButton(ctx.i18n.t('subscribe.key.check'), `subscription`)]
        ]),
        disable_web_page_preview: true
      })
    }
  }

  return next()
}