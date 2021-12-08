const User = require('../models/user')

module.exports = async (ctx) => {
  return User.findOne({ id: ctx.from.id }, { active: ctx.myChatMember.new_chat_member.status === 'kicked' ? false : true })
}