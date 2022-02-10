require("dotenv").config({ path: `${__dirname}/.env` })

const mongoose = require("./models")

const { Telegraf } = require('telegraf')
const allowedUpdates = ['message','inline_query','callback_query','my_chat_member']

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 1 })

bot.catch((err, ctx) => {
  if(err.code === 400){
    if(err.description === 'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message') return
  }
  return console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)
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

bot.use(require('./middlewares/attachUser'))

bot.use(async (ctx, next) => {
  if(ctx.message && ctx.message.text && ctx.chat && ctx.chat.type == 'private') console.log(`${(ctx.from.username && `@${ctx.from.username}`) || ctx.from.id} ввел "${ctx.message.text}"`)
  else if(ctx.callbackQuery) console.log(`${(ctx.from.username && `@${ctx.from.username}`) || ctx.from.id} отправил cb "${ctx.callbackQuery.data}"`)

  const startDate = Date.now()
  if(ctx.user && ctx.from) {
    ctx.user.username = ctx.from.username
    ctx.user.lastMessage = Date.now()
    ctx.user.name = ctx.from.first_name
    ctx.i18n.locale(ctx.user.lang)
  }
  await next()
  console.log(`${ctx.updateType} ${ctx.updateSubTypes} from ${ctx.from && ctx.from.id || "UNDEFINED"} ${Date.now()-startDate}ms`)
})

bot.on('text', require('./middlewares/sysRefs'))

bot.on('text', require('./actions/translateBot'))

bot.on('message', require('./middlewares/subscription'))

bot.on('message', require('./routers/message'))

bot.on('callback_query', require('./routers/callbackQuery'))

bot.on('inline_query', require('./routers/inlineQuery'))

bot.on('my_chat_member', require('./actions/myChatMmber'))

bot.launch(
  (process.env.USE_WEBHOOK==='true') ? {
    webhook: {
      domain: `https://${process.env.WEBHOOK_DOMAIN}`,
      hookPath: `/${process.env.WEBHOOK_PATH}/${process.env.BOT_TOKEN}`,
      port: process.env.WEBHOOK_PORT,
      extra: {
        max_connections: 100,
        allowed_updates: allowedUpdates
      }
    }
  } : {
    polling: { 
      allowedUpdates: allowedUpdates
    }
  }
)

bot.telegram.getWebhookInfo().then( (webhookInfo) => { console.log(`✅ Bot is up and running\n${JSON.stringify(webhookInfo, null, ' ')}`) })
console.log(`Bot is running.`)

const schedule = require('node-schedule')
const Mail = require('./models/mail')
const lauchWorker = require('./actions/admin/mail/lauchWorker')

function r(){}
(async () => {
  const result = await Mail.findOne({ $or : [{ status: 'notStarted'}, { status: 'doing'}]})
  if(result) lauchWorker(result._id)
})()

const job = schedule.scheduleJob('0 * * * * *', async () => {
  const result = await Mail.findOne({ status: 'notStarted', startDate: { $exists: true, $lte: new Date() } })
  if(result) lauchWorker(result._id)
})