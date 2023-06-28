const View = require('../models/view')
const config = require('../config.json')

const { randomInt } = require('crypto')
const axios = require('axios')

module.exports = async (ctx) => {
  let views = await View.find({
    $and: [
      {
        $or: [
          { startDate: { $gte: new Date() } },
          { startDate: { $exists: false } }
        ]
      },
      {
        $or: [
          { endDate: { $lte: new Date() } },
          { endDate: { $exists: false } }
        ]
      },
      { $or: [{ lang: ctx.user.lang }, { lang: null }] }
    ],
    status: 'doing'
  })

  views = views.filter((view) => {
    return !(view.unique && view.users.includes(ctx.user.id))
  })

  if (!views.length) {
    if (!config.gramads) return

    const responce = await axios
      .post(
        `https://api.gramads.net/ad/SendPost`,
        {
          SendToChatId: ctx.user.id
        },
        {
          headers: {
            Authorization: `bearer ${config.gramads}`,
            'content-type': 'application/json'
          }
        }
      )
      .catch(() => {})
    if (!responce.data.ok) return
  }

  const view = views[randomInt(0, views.length)]
  delete view.message.chat

  return Promise.all([
    View.findByIdAndUpdate(view._id, {
      $addToSet: { users: ctx.user.id },
      status:
        view.quantity && view.quantity <= view.views + 1 ? 'ended' : 'doing',
      $inc: { views: 1 }
    }),
    ctx.telegram.sendCopy(ctx.user.id, view.message, {
      reply_markup: {
        inline_keyboard: view.keyboard
      },
      disable_web_page_preview: !view.preview
    })
  ])
}
