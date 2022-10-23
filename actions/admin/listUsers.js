const User = require('../../models/user')
const Markup = require('telegraf/markup')
var exportTemplate = {
  _id: '', id: '', name: '', username: '', state: '', lang: '', ban: '', langCode: '', alive: '', from: '', lastMessage: '', createdAt: '', updatedAt: '' 
}

module.exports = async (ctx) => {
  if(ctx.state[0]) {
    await ctx.answerCbQuery(`Экспортирование`, true)

    switch (ctx.state[0]) {
      case 'alive':
        var users = await User.find({ alive: true }, '-_id id').lean()

        var content = users.map((value) => Object.values(value).join(';')).join('\n')
        break
      case 'all':
        var users = await User.find({}, '-_id id').lean()

        var content = users.map((value) => Object.values(value).join(';')).join('\n')
        break
      case 'full':
        var users = await User.find({},  Object.keys(exportTemplate).join(' ')).lean()

        var content = Object.keys(exportTemplate).join(';')
        content += `\n${users.map((value) => Object.values({ ...exportTemplate, ...value }).join(';')).join('\n')}`
        break
    }

    return ctx.replyWithDocument({ source: Buffer.from(content, 'utf8'), filename: `users.csv` })
  } else {
    await ctx.answerCbQuery()

    return ctx.editMessageText(`Выберите вариант экспорта:`, Markup.inlineKeyboard([
      [
        Markup.callbackButton(`Бекап`, `admin_listUsers_full`),
        Markup.callbackButton(`Полный`, `admin_listUsers_all`),
        Markup.callbackButton(`Живые`, `admin_listUsers_alive`),
      ], 
      [Markup.callbackButton(`Назад`, `admin_back`)], 
    ]).extra())
  }
}