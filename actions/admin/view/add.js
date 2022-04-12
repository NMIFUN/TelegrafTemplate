const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    ctx.user.state = `admin_view_add`
    return ctx.replyWithHTML(`Отправьте любой пост в готовом виде.`, { 
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(`Назад`, `admin_view`)
      ]),
      parse_mode: "HTML"
    })
  }else{
    const view = ctx.View({
      uid: ctx.from.id,
      message: ctx.message,
      keyboard: ctx.message.reply_markup,
      status: 'notStarted',
    })
    await view.save()
    ctx.user.state = null

    return ctx.replyWithHTML(`Пост сохранен`, { 
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(`Продолжить настройку`, `admin_view_id_${view._id}`)
      ])
    })
  }
}