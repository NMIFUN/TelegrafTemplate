const Markup = require('telegraf/markup')
const config = require('../../config.json')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const text = `Админ панель`
  
  if(ctx.callbackQuery && ctx.callbackQuery.data.split('_')[1] === 'botStat') {
    config.botStat = !config.botStat
    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  }

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton(`Статистика`, `admin_stat`),
      Markup.callbackButton(`Админы`, `admin_addAdmin`)
    ],
    [
      Markup.callbackButton(`Рассылка`, `admin_mail`),
      Markup.callbackButton(`Просмотры`, `admin_view`)
    ],
    [
      Markup.callbackButton(`Рефералка`, `admin_sysRef`),
      Markup.callbackButton(`Список пользователей`, `admin_listUsers`)
    ],
    [
      Markup.callbackButton(`BotStat.io ${config.botStat ? '✅' : '❌'}`, `admin_botStat`),
      Markup.callbackButton(`(Раз)бан пользователя`, `admin_ban`)
    ],
    [
      Markup.callbackButton(`Обязательная подписка`, `admin_addSubscription`),
      Markup.callbackButton(`Обязательная подписка бот`, `admin_addBotSubscription`)
    ],
    [
      Markup.callbackButton(`Принятие заявок`, `admin_addJoin`),
    ]
  ]).extra({ parse_mode: "HTML" })

  ctx.user.state = null

  if(ctx.updateType === 'callback_query'){
    await ctx.answerCbQuery()

    if(ctx.callbackQuery.message.text) return ctx.editMessageText(text, keyboard)
    else await ctx.deleteMessage()
  } 
  
  return ctx.replyWithHTML(text, keyboard)
}