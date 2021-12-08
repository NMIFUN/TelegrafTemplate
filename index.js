require("dotenv").config({ path: `${__dirname}/.env` })

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})

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

const attachUser = require('./middlewares/attachUser')
bot.use(attachUser)

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

const sysRefs = require('./middlewares/sysRefs')
bot.on('text', sysRefs)

const translateBot = require('./actions/translateBot')
bot.on('text', translateBot)

const subscription = require('./middlewares/subscription')
bot.on('message', subscription)

const messageRouter = require('./routers/message')
const callbackQueryRouter = require('./routers/callbackQuery')

bot.on('message', messageRouter)

bot.on('callback_query', callbackQueryRouter)

const myChatMmber = require('./actions/myChatMmber')
bot.on('my_chat_member', myChatMmber)

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