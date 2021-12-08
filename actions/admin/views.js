const Ref = require('../../models/ref')
const dateConfig = { year: 'numeric',month:'numeric',day:'numeric',hour:'numeric',minute: 'numeric'}
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  let a = Number(ctx.state[0])
  if(!a) a = 0
  if(a<0) return ctx.answerCbQuery('Нельзя', true)

  const count = await Ref.countDocuments()
  if(a>count) return ctx.answerCbQuery('Нельзя', true)

  await ctx.answerCbQuery()

  const results = await Ref.find({}).skip( a ).limit( 30 )
  let content = ``
  for (const view of results) {
    content += `\n<b>${view.name}</b>:
<b>🌐 Всего переходов:</b> ${view.count}
<b>👤 Уникальных переходов:</b> ${view.uniqueCount}
<b>🆕 Новых пользователей:</b> ${view.newCount}
<b>🕕 Первый переход:</b> ${new Date(view.first).toLocaleString('ru', dateConfig)}
<b>🕧 Последний переход:</b> ${new Date(view.last).toLocaleString('ru', dateConfig)}`
  }

  return ctx.editMessageText(`👥 Реферальная система:\n${a}/${count}\n${content}`, { 
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      [Markup.callbackButton(`◀️`, `admin_views_${a-10}`),
      Markup.callbackButton(`🔄`, `admin_views_${a}`),
      Markup.callbackButton(`▶️`, `admin_views_${a+10}`)],
      [Markup.callbackButton(`◀️`, `admin_back`)]
    ])
  })
}