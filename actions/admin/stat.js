const User = require('../../models/user.js')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  
  const promises = [
    await User.countDocuments(),
    await User.countDocuments({ alive: true }),
    await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, alive: true }),
    await User.countDocuments({ lastMessage: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, alive: true }),
    await User.countDocuments({ lastMessage: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, alive: true }),
    await User.countDocuments({ lang: 'ru', alive: true }),
    await User.countDocuments({ lang: 'en', alive: true })
  ]

  const [ all, alive, aliveForMonth, activeForDay, activeForMonth, ru, en ] = await Promise.all(promises)
  
  const text = `Всего пользователей: ${all}

Живых пользователей: ${alive}
Живых пользователей за месяц: ${aliveForMonth}

Активных за 24 часа: ${activeForDay}
Активных за месяц: ${activeForMonth}

RU: ${ru}

EN: ${en}`

  return ctx.editMessageText(text, Markup.inlineKeyboard([
    [Markup.callbackButton(`Обновить`, `admin_stat`)],
    [Markup.callbackButton(`Назад`, `admin_back`)]
  ]).extra({ parse_mode: "HTML" }))
}