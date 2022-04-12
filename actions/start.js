const View = require('../models/view')
const { randomInt } = require('crypto')

module.exports = async (ctx) => {
  let views = await View.find({
    $or: [{startDate: { $gte: new Date() }}, {startDate: { $exists: false }}],
    $or: [{endDate: { $lte: new Date() }}, {endDate: { $exists: false }}],
    $or: [{lang: ctx.user.lang }, {lang: null}],
    status: 'doing'
  })

  views = views.filter(view => {
    if(view.unique && view.users.includes(ctx.from.id)) return false
    else return true
  })
  
  if(views.length !== 0) {
    const view = views[randomInt(0, views.length)]

    await ctx.telegram.sendCopy(ctx.from.id, view.message, { 
      reply_markup: {
        inline_keyboard: view.keyboard
      }, 
      disable_web_page_preview: !view.preview 
    })

    await View.findByIdAndUpdate(view._id, { 
      $addToSet: { users: ctx.from.id },
      status: view.quantity && view.quantity <= view.views + 1  ? 'ended' : 'doing',
      $inc: { views: 1 }
    })
  }

  return ctx.replyWithHTML(ctx.i18n.t('start.text'))
}