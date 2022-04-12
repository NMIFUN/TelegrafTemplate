const User = require('../../models/user')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if(ctx.state[0]) {
    await ctx.answerCbQuery(`Экспортирование`, true)

    if(ctx.state[0] === 'all'){
      var users = await User.find({}, 'id')
    } else if(ctx.state[0] === 'alive'){
      var users = await User.find({ alive: true }, 'id')
    }

    let content = Object.values(users).map((value) => `${value.id}`).join('\n')
    return ctx.replyWithDocument({ source: Buffer.from(content), filename: `users.csv` })
  } else {
    await ctx.answerCbQuery()

    return ctx.editMessageText(`Выберите вариант экспорта:`, Markup.inlineKeyboard([
      [
        Markup.callbackButton(`Полный`, `admin_listUsers_all`),
        Markup.callbackButton(`Живые`, `admin_listUsers_alive`),
      ], 
      [Markup.callbackButton(`Назад`, `admin_back`)], 
    ]).extra())
  }
}