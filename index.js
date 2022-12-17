/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })
const config = require('./config.json')

const fs = require('fs').promises

// eslint-disable-next-line no-extend-native
Number.prototype.format = function (n, x) {
  const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')'
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$& ')
}

require('./models')

const { Telegraf } = require('telegraf')
const allowedUpdates = [
  'message',
  'inline_query',
  'callback_query',
  'my_chat_member',
  'chat_join_request'
]

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 1 })

bot.catch(async (err, ctx) => {
  if (
    err.code === 429 &&
    err.description?.startsWith('Too Many Requests: retry after') &&
    (Date.now() - config.lastFloodError > 180000 || !config.lastFloodError)
  ) {
    await ctx.telegram.sendMessage(
      process.env.DEV_ID,
      `FLOOD ERROR in ${ctx.updateType} | ${
        (ctx?.message?.text &&
          Array.from(convertChars(ctx.message.text)).slice(0, 300).join('')) ||
        ctx?.callbackQuery?.data ||
        ctx?.inlineQuery?.query ||
        'empty'
      }
      \n<i>${err.description}</i>`,
      { parse_mode: 'HTML' }
    )

    config.lastFloodError = Date.now()
    return fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  } else if (
    err.code === 400 &&
    err.description ===
      'Bad Request: query is too old and response timeout expired or query ID is invalid'
  )
    return ctx.telegram.sendMessage(
      process.env.DEV_ID,
      `SLOW ANSWER in ${ctx.updateType} | ${ctx.callbackQuery.data}
      \n<i>${err.description}</i>`,
      { parse_mode: 'HTML' }
    )
  else if (
    (err.code === 400 || err.code === 403) &&
    err.description &&
    [
      'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message',
      'Bad Request: message to delete not found',
      'Forbidden: bot was blocked by the user',
      "Bad Request: message can't be deleted for everyone"
    ].includes(err.description)
  ) {
    return
  }

  console.error(
    `ERROR in ${ctx.updateType} | ${ctx.from?.id || 'noUserId'} | ${
      (ctx?.message?.text &&
        Array.from(ctx.message.text).slice(0, 300).join('')) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } ${ctx.user?.state || 'noState'}`,
    err
  )

  return ctx.telegram.sendMessage(
    process.env.DEV_ID,
    `ERROR in ${ctx.updateType} | ${ctx.from?.id || 'noUserId'} | ${
      (ctx.message?.text &&
        Array.from(convertChars(ctx.message.text)).slice(0, 300).join('')) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } ${ctx.user?.state || 'noState'}
    \n<code>${err.stack}</code>\n${
      (err.on && `<code>${JSON.stringify(err.on, null, 2)}</code>`) || 'noStack'
    }`,
    { parse_mode: 'HTML' }
  )
})

const I18n = require('telegraf-i18n')
const i18n = new I18n({
  directory: 'locales',
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true
})
bot.use(i18n.middleware())

const rateLimit = require('telegraf-ratelimit')
const limitConfig = {
  window: 3000,
  limit: 3
}
bot.use(rateLimit(limitConfig))

bot.on('chat_join_request', require('./actions/chatJoin'))
bot.on('my_chat_member', require('./actions/myChatMember'))

bot.use(require('./middlewares/attachUser'))

const convertChars = require('./helpers/convertChars')

bot.use(async (ctx, next) => {
  const startDate = Date.now()

  if (ctx.user && ctx.from) {
    if (ctx.user.ban) return

    ctx.user.username = ctx.from.username
    ctx.user.lastMessage = Date.now()
    ctx.user.name = convertChars(ctx.from.first_name)
    ctx.user.alive = true
    ctx.user.langCode = ctx.from.language_code
    ctx.i18n.locale(
      ctx.user?.lang
        ? ctx.user.lang
        : ['en', 'ru'].includes(ctx.from.language_code)
        ? ctx.from.language_code
        : 'ru'
    )
  }

  await next()

  console.log(
    `${new Date().toLocaleString('ru')} ${ctx.updateType}[${
      ctx.updateSubTypes
    }] | ${ctx.from?.id || 'noUserId'} | ${ctx.chat?.id || 'noChatId'} | ${
      ctx.message?.text?.slice(0, 64) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } [${Date.now() - startDate}ms]`
  )
})

bot.on('text', require('./middlewares/sysRefs'))

bot.on('text', require('./actions/translateBot'))

bot.on('message', require('./middlewares/subscription'))

bot.on('message', require('./routers/message'))

bot.on('callback_query', require('./routers/callbackQuery'))

bot.on('inline_query', require('./routers/inlineQuery'))

bot.launch(
  process.env.USE_WEBHOOK === 'true'
    ? {
        webhook: {
          domain: `https://${process.env.WEBHOOK_DOMAIN}`,
          hookPath: `/${process.env.WEBHOOK_PATH}/${process.env.BOT_TOKEN}`,
          port: process.env.WEBHOOK_PORT,
          extra: {
            max_connections: 100,
            allowed_updates: allowedUpdates
          }
        }
      }
    : {
        polling: {
          allowedUpdates
        }
      }
)

bot.telegram.getWebhookInfo().then((webhookInfo) => {
  console.log(
    `✅ Bot is up and running\n${JSON.stringify(webhookInfo, null, ' ')}`
  )
})
bot.telegram.getMe().then((info) => console.log(info))

const updateStat = require('./helpers/updateStat')
const botStat = require('./helpers/botStat')

const schedule = require('node-schedule')
const Mail = require('./models/mail')
const User = require('./models/user')
const lauchWorker = require('./actions/admin/mail/lauchWorker')

function imitateAsync() {}
;(async () => {
  const result = await Mail.findOne({ status: 'doing' })
  if (result) lauchWorker(result._id)
})()

schedule.scheduleJob('* * * * *', async () => {
  const result = await Mail.findOne({
    status: 'notStarted',
    startDate: { $exists: true, $lte: new Date() }
  })
  if (result) lauchWorker(result._id)
})

const { randomInt } = require('crypto')

schedule.scheduleJob(`0 ${randomInt(2, 6)} * * *`, async () => {
  await updateStat(bot)

  await botStat()
})
