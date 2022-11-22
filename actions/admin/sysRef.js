const Ref = require('../../models/ref')
const User = require('../../models/user')

const dateConfig = { year: 'numeric',month:'numeric',day:'numeric',hour:'numeric',minute: 'numeric'}
const Markup = require('telegraf/markup')

const defaultShift = 20

module.exports = async (ctx) => {
  if(!ctx.state[0]) ctx.state[0] = 0
  
  if(isNaN(ctx.state[0])) {
    await ctx.answerCbQuery()

    const [
      result,
      alive,
    ] = await Promise.all([
      Ref.findOne({ name: ctx.state[0] }),

      User.countDocuments({ from: `ref-${ctx.state[0]}`, alive: true })
    ])

    return ctx.editMessageText(`
Всего переходов: ${result.count}
Уникальных переходов: ${result.uniqueCount} (${Math.round(result.uniqueCount / result.count * 100)}%)
Новых пользователей: ${result.newCount} (${Math.round(result.newCount / result.uniqueCount * 100)}%)
Живых пользователей: ${alive} (${Math.round(alive / result.newCount * 100)}%)

Последний переход: ${new Date(result.last).toLocaleString('ru', dateConfig)}

Ссылка: https://t.me/${process.env.BOT_USERNAME}?start=ref-${result.name}
    `, Markup.inlineKeyboard([
      [Markup.callbackButton(`🔄 Обновить`, `admin_sysRef_${result.name}`)],
      [Markup.callbackButton(`Назад`, `admin_sysRef`)]
    ]).extra({ 
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }))
  }

  let shift = Number(ctx.state[0])
  const count = await Ref.countDocuments()
  if(shift < 0 || shift >= count) return ctx.answerCbQuery('Нельзя', true)
  await ctx.answerCbQuery()

  if(!count) return ctx.editMessageText(`Реферальных ссылок еще не существует.\n
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code, переходя по такой ссылке пользователь автоматически учитывается в списке.
code - любой код для отличия ссылки от других ссылок`, Markup.inlineKeyboard(
    [Markup.callbackButton(`Назад`, `admin_back`)]
  ).extra({ 
    parse_mode: 'HTML',
    disable_web_page_preview: true
  }))

  const results = await Ref.find().skip(shift).limit(defaultShift).sort({ _id: -1 })
  
  let content = results.map(result => `<b>${result.name}</b>: ${result.count} / ${result.uniqueCount}`)
  const keyboard = results.map(result => Markup.callbackButton(`${result.name} ${result.count}`, `admin_sysRef_${result.name}`))

  return ctx.editMessageText(`
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code

${content.join('\n')}`, {
    parse_mode: 'HTML',
    reply_markup: { 
      inline_keyboard: Markup.inlineKeyboard(keyboard, { columns: 2 }).inline_keyboard.concat([
        [Markup.callbackButton(`◀️`, `admin_sysRef_${shift - defaultShift}`),
        Markup.callbackButton(`${shift + results.length}/${count} 🔄`, `admin_sysRef_${shift}`),
        Markup.callbackButton(`▶️`, `admin_sysRef_${shift + defaultShift}`)],
        [Markup.callbackButton(`Назад`, `admin_back`)]
      ])
    }
  })
}