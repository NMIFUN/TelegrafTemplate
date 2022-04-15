const User = require('../../models/user.js')
const Markup = require('telegraf/markup')
const config = require('../../config')

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const text = `Админ панель`

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton(`Статистика`, `admin_stat`)
    ],
    [
      Markup.callbackButton(`Рассылка`, `admin_mail`),
      Markup.callbackButton(`Просмотры`, `admin_view`)
    ],
    [
      Markup.callbackButton(`Рефералка`, `admin_sysRef`),
      Markup.callbackButton(`Список пользователей`, `admin_listUsers`),
    ],
    [
      Markup.callbackButton(`Админы`, `admin_addAdmin`),
      Markup.callbackButton(`Обязательная подписка`, `admin_addSubscription`)
    ],
    [
      Markup.callbackButton(`(Раз)бан пользователя`, `admin_ban`),
      Markup.callbackButton(`Обновить`, `admin_back`)
    ]
  ]).extra()

  ctx.user.state = null

  if(ctx.updateType === 'callback_query'){
    await ctx.answerCbQuery()

    if(ctx.callbackQuery.message.text) return ctx.editMessageText(text, { 
      ...keyboard,
      parse_mode: "HTML"
    })
    else {
      await ctx.deleteMessage()
      return ctx.replyWithHTML(text, keyboard)
    }
  } else {
    return ctx.replyWithHTML(text, keyboard)
  }
}