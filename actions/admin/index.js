const config = require('../../config.json')
const admin = require('../../helpers/admin.js')

module.exports = async (ctx) => {
  ctx.user.state = null

  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    return ctx.editMessageText(admin.text, { 
      ...admin.keyboard,
      parse_mode: "HTML"
    })
  } else {
    return ctx.replyWithHTML(admin.text, admin.keyboard)
  }
}