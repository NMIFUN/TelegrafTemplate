const User = require('../../models/user.js')
const Markup = require('telegraf/markup')
const config = require('../../config')

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const text = `Админ панель

Всего пользователей: ${await User.countDocuments()}
Всего пользователей за месяц: ${await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })}
Живых пользователей: ${await User.countDocuments({ alive: true })}
Живых пользователей за месяц: ${await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, alive: true })}

Активных за 24 часа: ${await User.countDocuments({ lastMessage: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })}
Активных за месяц: ${await User.countDocuments({ lastMessage: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })}

RU:
Всего: ${await User.countDocuments({ lang: 'ru' })}
Живых: ${await User.countDocuments({ lang: 'ru', alive: true })}

EN:
Всего: ${await User.countDocuments({ lang: 'en' })}
Живых: ${await User.countDocuments({ lang: 'en', alive: true })}`

  const keyboard = Markup.inlineKeyboard([
    Markup.callbackButton(`Рассылка`, `admin_mail`),
    Markup.callbackButton(`Просмотры`, `admin_view`),
    Markup.callbackButton(`Рефералка`, `admin_sysRef`),
    Markup.callbackButton(`Список пользователей`, `admin_listUsers`),
    Markup.callbackButton(`Админы`, `admin_addAdmin`),
    Markup.callbackButton(`Обязательная подписка`, `admin_addSubscription`),
    Markup.callbackButton(`(Раз)бан пользователя`, `admin_ban`),
    Markup.callbackButton(`Обновить`, `admin_back`),
  ], { columns: 2 }).extra()

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