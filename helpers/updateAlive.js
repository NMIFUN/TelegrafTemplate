const User = require('../models/user')

module.exports = async (bot) => {
  const users = await User.find()

  const promises = users.map(async user => await bot.telegram.sendChatAction(user.id, 'typing'))
  const result = await Promise.all(promises)

  console.log(result)
}