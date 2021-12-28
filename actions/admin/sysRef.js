const Ref = require('../../models/ref')
const dateConfig = { year: 'numeric',month:'numeric',day:'numeric',hour:'numeric',minute: 'numeric'}
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  let a = Number(ctx.state[0])
  if(!a) a = 0
  if(a<0) return ctx.answerCbQuery('Нельзя', true)

  const count = await Ref.countDocuments()
  if(a >= count) return ctx.answerCbQuery('Нельзя', true)

  await ctx.answerCbQuery()

  const results = await Ref.find().skip( a ).limit( 10 )
  let content = ``
  for (const result of results) {
    content += `\n<b>${result.name}</b>:
Всего переходов: ${result.count}
Уникальных переходов: ${result.uniqueCount}
Новых пользователей: ${result.newCount}
Первый переход: ${new Date(result.first).toLocaleString('ru', dateConfig)}
Последний переход: ${new Date(result.last).toLocaleString('ru', dateConfig)}\n`
  }

  return ctx.editMessageText(`
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code, переходя по такой ссылке пользователь автоматически учитывается в списке.
code - любой код для отличия ссылки от других ссылок
${content}`, {  
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      [Markup.callbackButton(`◀️`, `admin_sysRef_${a-10}`),
      Markup.callbackButton(`${a + results.length}/${count} 🔄`, `admin_sysRef_${a}`),
      Markup.callbackButton(`▶️`, `admin_sysRef_${a+10}`)],
      [Markup.callbackButton(`◀️`, `admin_back`)]
    ])
  })
}