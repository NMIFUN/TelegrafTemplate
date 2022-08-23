const User = require('../../models/user')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
  const month = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0)

  const promises = [
    User.countDocuments(),
    User.countDocuments({ alive: true }),

    User.countDocuments({ lastMessage: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, alive: true }),
    
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: today }, alive: true }),

    User.countDocuments({ createdAt: { $gte: yesterday, $lte: today } }),
    User.countDocuments({ createdAt: { $gte: yesterday, $lte: today }, alive: true }),

    User.countDocuments({ createdAt: { $gte: month } }),
    User.countDocuments({ createdAt: { $gte: month }, alive: true }),

    User.countDocuments({ lang: 'ru', alive: true }),
    User.countDocuments({ lang: 'en', alive: true })
  ]

  const [ 
    all, alive, 
    activeForDay, 
    forDay, aliveForDay, 
    forYesterday, aliveForYesterday, 
    forMonth, aliveForMonth, 
    ru, en
  ] = await Promise.all(promises)
  
  const text = `Всего: ${all}
Живых: ${alive}

Активных за 24 часа: ${activeForDay}

Сегодня: +${forDay} (+${aliveForDay})
Вчера: +${forYesterday} (+${aliveForYesterday})
Месяц: +${forMonth} (+${aliveForMonth}) 

RU: ${ru}
EN: ${en}`

  return ctx.editMessageText(text, Markup.inlineKeyboard([
    [Markup.callbackButton(`Обновить`, `admin_stat`)],
    [Markup.callbackButton(`Назад`, `admin_back`)]
  ]).extra({ parse_mode: "HTML" }))
}