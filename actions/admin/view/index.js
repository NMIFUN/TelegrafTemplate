const View = require('../../../models/view')
const Markup = require('telegraf/markup')
const dateConfig = { year: 'numeric',month:'numeric',day:'numeric',hour:'numeric',minute: 'numeric'}

module.exports = async (ctx) => {
  let a = Number(ctx.state[0])
  if(!a) a = 0
  if(a<0) return ctx.answerCbQuery('Нельзя', true)

  const count = await View.countDocuments()
  if(a>count) return ctx.answerCbQuery('Нельзя', true)

  await ctx.answerCbQuery()

  if(count === 0) return ctx.editMessageText(`Нет просмотров`, {
    reply_markup: Markup.inlineKeyboard([
      [Markup.callbackButton(`Добавить`, `admin_view_add`)], 
      [Markup.callbackButton(`Назад`, `admin_back`)], 
    ]),
    parse_mode: "HTML"
  })
  else {
    const result = await View.findOne().skip(a)
    const keyboard = result.keyboard.concat(Markup.inlineKeyboard([
      [ 
        Markup.callbackButton(`◀️`, `admin_view_${a-1}`),
        Markup.callbackButton(`🔄`, `admin_view_${a}`),
        Markup.callbackButton(`▶️`, `admin_view_${a+1}`)
      ],
      [ 
        Markup.callbackButton(`${new Date(result.startDate).toLocaleString('ru', dateConfig)}`, `admin_view_date_${result._id}_start`),
        Markup.callbackButton(`${result.views} 👁`, `admin_view_none`),
        Markup.callbackButton(`${new Date(result.endDate).toLocaleString('ru', dateConfig)}`, `admin_view_date_${result._id}_end`)
      ],
      [
        Markup.callbackButton(`Уникальные ${result.unique ? '✅' : '❌'}`, `admin_view_unique_${result._id}`),
        Markup.callbackButton(`${a+1}/${count}`, `admin_view_none`),
        Markup.callbackButton(`🗑`, `admin_view_del_${result._id}`)
      ],
      [
        Markup.callbackButton(`Добавить`, `admin_view_add`)
      ]
    ]))
    return ctx.telegram.sendCopy(ctx.from.id, result.message, { reply_markup: { inline_keyboard: keyboard } })
  }
}