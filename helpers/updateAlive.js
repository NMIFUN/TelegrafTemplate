const User = require('../models/user')
const sleep = (millis) => new Promise(resolve => setTimeout(resolve, millis))

module.exports = async (bot) => {
  const users = await User.find({}, { id: 1 })

  let promises = []
  let died = []
  let alive = []
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    promises.push(bot.telegram.sendChatAction(user.id, 'typing')
    .then((r) => alive.push(user.id))
    .catch(async (e) => {
      if(e.description && e.description.startsWith('Too Many Requests:')) {
        await sleep(parseInt(e.description.match(/\d+/)) * 1000)
        i--
      } else died.push(user.id)
		}))
    
    if(i % 10 === 0) {
      await Promise.all(promises)
      promises = []

      await sleep(120)
    }

    if(i % 100 === 0) {
      await User.updateMany({ id: { $in: died } }, { alive: false })
      died = []

      await User.updateMany({ id: { $in: alive } }, { alive: true })
      alive = []
    }
  }

  await Promise.all(promises)
  await User.updateMany({ id: { $in: died } }, { alive: false })
  await User.updateMany({ id: { $in: alive } }, { alive: true })

  return
}