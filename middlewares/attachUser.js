const User = require('../models/user')
const convertChars = require('../helpers/convertChars')
const saveModifier = require('../helpers/saveModifier')

module.exports = async (ctx, next) => {
  let user = await User.findOne({ id: ctx.from.id })

  if (!user && (ctx?.chat?.type === 'private' || ctx.callbackQuery)) {
    user = new User({
      id: ctx.from.id,
      name: convertChars(ctx.from.first_name),
      username: ctx.from.username,
      langCode: ctx.from.language_code,
      alive: true,
      from: ctx?.message?.text?.split(' ')[1] || null,
      lastMessage: Date.now()
    })

    await saveModifier(user)

    ctx.freshUser = true
  }
  ctx.user = user

  await next()

  return saveModifier(ctx.user)
}
