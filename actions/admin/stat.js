const User = require('../../models/user')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery(`Получаю статистику, ожидайте`)

  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  )
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    0,
    0,
    0,
    0
  )
  const week = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
    0,
    0,
    0,
    0
  )
  const month = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 30,
    0,
    0,
    0,
    0
  )

  const promises = [
    User.countDocuments(),
    User.countDocuments({ alive: true }),

    User.countDocuments({ alive: true, lastMessage: { $gte: today } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: week } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: month } }),

    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ alive: true, createdAt: { $gte: today } }),

    User.countDocuments({ createdAt: { $gte: yesterday, $lte: today } }),
    User.countDocuments({
      alive: true,
      createdAt: { $gte: yesterday, $lte: today }
    }),

    User.countDocuments({ createdAt: { $gte: month } }),
    User.countDocuments({ alive: true, createdAt: { $gte: month } }),

    User.aggregate([
      { $match: { alive: true } },
      { $group: { _id: '$langCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]

  const [
    all,
    alive,
    dau,
    wau,
    mau,
    forDay,
    aliveForDay,
    forYesterday,
    aliveForYesterday,
    forMonth,
    aliveForMonth,
    langCodes
  ] = await Promise.all(promises)

  const text = `Всего: ${all}
Живых: ${alive}

DAU: ${dau}
WAU: ${wau}
MAU: ${mau}

Сегодня: +${forDay} (+${aliveForDay})
Вчера: +${forYesterday} (+${aliveForYesterday})
Месяц: +${forMonth} (+${aliveForMonth}) 

${langCodes
  .filter((lang) => lang.count > (langCodes[0].count / 100) * 1)
  .map((lang) => `${lang._id?.toUpperCase()}: ${lang.count}`)
  .join(', ')}`

  return ctx.editMessageText(
    text,
    Markup.inlineKeyboard([
      [Markup.callbackButton('Обновить', 'admin_stat')],
      [Markup.callbackButton('‹ Назад', 'admin_back')]
    ]).extra({ parse_mode: 'HTML' })
  )
}
