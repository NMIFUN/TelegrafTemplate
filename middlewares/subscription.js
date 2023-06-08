const { Telegraf } = require('telegraf')
const axios = require('axios')
const Markup = require('telegraf/markup')

const config = require('../config')
const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then((results) =>
    arr.filter((_v, index) => results[index])
  )
const start = require('../actions/start')

module.exports = async (ctx, next) => {
  if (config.admins.includes(ctx.from.id) || ctx?.chat?.type !== 'private')
    return next()

  if (!config.subsBots) config.subsBots = []
  config.subsBots = config.subsBots.filter((e) => e.url)
  if (!config.subsChannels) config.subsChannels = []
  config.subsChannels = config.subsChannels.filter((e) => e.url)

  let notSubscribed = []

  const channels = config.subsChannels.filter((channel) =>
    [undefined, ctx.user?.lang].includes(channel.lang)
  )
  if (channels.length)
    notSubscribed = await asyncFilter(channels, async (channel) => {
      const check = channel.id
        ? (await ctx.telegram
            .getChatMember(channel.id, ctx.from.id)
            .catch(() => {})) || {}
        : { status: 'kicked' }

      return ['left', 'kicked'].includes(check.status)
    })

  const bots = config.subsBots.filter((channel) =>
    [undefined, ctx.user?.lang].includes(channel.lang)
  )
  if (bots.length)
    notSubscribed = notSubscribed.concat(
      await asyncFilter(bots, async (bot) => {
        if (bot.token) {
          if (bot.token.includes(':')) {
            const connectedBot = new Telegraf(bot.token)
            const check =
              (await connectedBot.telegram
                .sendChatAction(ctx.from.id, 'typing')
                .catch(() => {})) || false

            return !check
          } else {
            const check = await axios
              .get(
                `https://api.botstat.io/checksub/${bot.token}/${ctx.from.id}`
              )
              .catch(() => ({ data: { ok: false } }))

            return !check.data.ok
          }
        } else return true
      })
    )

  if (notSubscribed.filter((channel) => channel.id || channel.token).length) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery(ctx.i18n.t('subscribe.notif'))
    }

    return ctx[
      ctx.message || !ctx.callbackQuery.message.text
        ? 'replyWithHTML'
        : 'editMessageText'
    ](ctx.i18n.t('subscribe.text'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(
        [
          ...notSubscribed
            .sort((channel) => (!channel.id && !channel.token ? -1 : 1))
            .map((channel, index) => {
              return Markup.urlButton(
                `${ctx.i18n.t(
                  `subscribe.${channel.token ? 'bot' : 'channel'}`
                )} №${index + 1}`,
                channel.url
              )
            }),
          Markup.callbackButton(
            ctx.i18n.t('subscribe.key.check'),
            'subscription'
          )
        ],
        { columns: 1 }
      ),
      disable_web_page_preview: true
    })
  }

  ctx.user.subscribed = true

  if (ctx.callbackQuery?.data === 'subscription') {
    await ctx.answerCbQuery()
    await ctx.editMessageText(ctx.i18n.t('subscribe.success'))

    return start(ctx)
  }

  return next()
}
