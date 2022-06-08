const Ref = require('../../models/ref')
const User = require('../../models/user')

const dateConfig = { year: 'numeric',month:'numeric',day:'numeric',hour:'numeric',minute: 'numeric'}
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  let shift = Number(ctx.state[0])
  if(!shift) shift = 0
  if(shift<0) return ctx.answerCbQuery('Нельзя', true)

  const count = await Ref.countDocuments()
  if(shift >= count) return ctx.editMessageText(`Реферальных ссылок еще не существует.\n
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code, переходя по такой ссылке пользователь автоматически учитывается в списке.
code - любой код для отличия ссылки от других ссылок`, Markup.inlineKeyboard(
    [Markup.callbackButton(`Назад`, `admin_back`)]
  ).extra({ parse_mode: 'HTML' }))

  await ctx.answerCbQuery()

  const results = await Ref.find().skip(shift).limit(10).sort({ _id: -1 })
  
  let content = results.map(async result => {
    const alive = await User.countDocuments({ from: `ref-${result.name}`, alive: true })

    return `<b>${result.name}</b>:
Всего/Уникальных переходов: ${result.count} / ${result.uniqueCount}
Новых/Живых пользователей: ${result.newCount} / ${alive}
Последний переход: ${new Date(result.last).toLocaleString('ru', dateConfig)}`
  })
  content = await Promise.all(content)

  return ctx.editMessageText(`
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code, переходя по такой ссылке пользователь автоматически учитывается в списке.
code - любой код для отличия ссылки от других ссылок

${content.join('\n\n')}`, {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      [Markup.callbackButton(`◀️`, `admin_sysRef_${shift-10}`),
      Markup.callbackButton(`${shift + results.length}/${count} 🔄`, `admin_sysRef_${shift}`),
      Markup.callbackButton(`▶️`, `admin_sysRef_${shift+10}`)],
      [Markup.callbackButton(`Назад`, `admin_back`)]
    ])
  })
}