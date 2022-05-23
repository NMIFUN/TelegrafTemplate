const config = require('../config')
const Markup = require('telegraf/markup')

module.exports = async (ctx, next) => {
  if (config.admins.includes(ctx.from.id)) return next()

  const channels = config.subsChannels.filter(channel => [ctx.user.lang, 'all'].includes(channel.lang))
  
  for (const channel of channels) {
    const check = await ctx.telegram.getChatMember(channel.id, ctx.from.id).catch(() => {}) || {}

    if(['left', 'kicked'].includes(check.status)) {
      if(ctx.callbackQuery) await ctx.answerCbQuery(ctx.i18n.t('subscribe.notif'))

      return ctx[ctx.updateType === 'message' ? 'replyWithHTML' : 'editMessageText'](ctx.i18n.t('subscribe.text', { 
        channels: channels.map(element => `<a href="${element.link}">${element.title}</a>`).join(', ')
      }), {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          ...channels.map(element => Markup.urlButton(element.title, element.link)),
          Markup.callbackButton(ctx.i18n.t('subscribe.key.check'), `subscription`)
        ], { columns: 1 }),
        disable_web_page_preview: true
      })
    }
  }

  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    return ctx.editMessageText(ctx.i18n.t('subscribe.success'))
  }

  return next()
}