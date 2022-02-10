const User = require('../../models/user')

module.exports = async (ctx) => {
  await ctx.answerCbQuery(`Экспортирование`)

  let users = await User.find({ alive: true })
  let content = Object.values(users).map((value) => `${value.id}`).join('\n')

  return ctx.replyWithDocument({ source: Buffer.from(content), filename: `users.csv` })
}