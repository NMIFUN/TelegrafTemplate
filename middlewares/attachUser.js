const User = require('../models/user')

module.exports = async (ctx, next) => {
  let user = await User.findOne({ id: ctx.from.id})
  if(!user) {
    user = new User({
      id: ctx.from.id,
      name: ctx.from.first_name,
      username: ctx.from.username,
      langCode: ctx.from.language_code
    })
    await user.save()
    ctx.freshUser = true
  }
  ctx.user = user

  await next()

  return ctx.user.save()
}