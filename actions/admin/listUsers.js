const User = require('../../models/user')

module.exports = async (ctx) => {
  await ctx.answerCbQuery(`Экспортирование`)
  let users = await User.find()
  
  let content = ``
  for (const user of users) {
    content += `${user.id}\n`
  }
  return ctx.replyWithDocument({ source: Buffer.from(content), filename: `users.csv` })
}