const config = require('../config')
const Markup = require('telegraf/markup')
const asyncFilter = async (arr, predicate) => Promise.all(arr.map(predicate))
	.then((results) => arr.filter((_v, index) => results[index]));
const start = require('../actions/start')

module.exports = async (ctx, next) => {
  if (config.admins.includes(ctx.from.id)) return next()

  const channels = config.subsChannels.filter(channel => [undefined, ctx.user.lang, 'all'].includes(channel.lang))
  const notSubscribed = await asyncFilter(channels, async channel => {
    const check = await ctx.telegram.getChatMember(channel.id, ctx.from.id).catch(() => {}) || {}

    if(['left', 'kicked'].includes(check.status)) return true
    else false
  })

  if(notSubscribed.length) {
    if(ctx.callbackQuery) await ctx.answerCbQuery(ctx.i18n.t('subscribe.notif'))

    let count = 0

    return ctx[ctx.updateType === 'message' ? 'replyWithHTML' : 'editMessageText'](ctx.i18n.t('subscribe.text'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        ...notSubscribed.map(channel => {
          count++
          return Markup.urlButton(`${ctx.i18n.t('subscribe.channel')} №${count}`, channel.link)
        }),
        Markup.callbackButton(ctx.i18n.t('subscribe.key.check'), `subscription`)
      ], { columns: 1 }),
      disable_web_page_preview: true
    })
  }

  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    await ctx.editMessageText(ctx.i18n.t('subscribe.success'))
    
    return start(ctx)
  }

  return next()
}