const { Router } = require('telegraf')
const config = require('../config')
const View = require('../models/view')
const Mail = require('../models/mail')

const router = new Router(async (ctx) => {
  const split =  ctx.callbackQuery.data.split('_')

  ctx.state = split.slice(1, split.length)
  return { route: split[0] }
})

router.on('translateBot', require('../actions/translateBot'))

router.on('subscription', require('../middlewares/subscription'))

router.on('inlineUpdateMail', require('../actions/admin/mail/inlineUpdate'))

const adminRouter = new Router(async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const split =  ctx.callbackQuery.data.split('_')
  
  ctx.state = split.slice(2, split.length)
  return { route: split[1] }
})

adminRouter.on('addAdmin', require('../actions/admin/addAdmin'))

adminRouter.on('addSubscription', require('../actions/admin/addSubscription'))

adminRouter.on('listUsers', require('../actions/admin/listUsers'))

adminRouter.on('sysRef', require('../actions/admin/sysRef'))

const adminViewRouter = new Router(async (ctx) => {
  const split =  ctx.callbackQuery.data.split('_')

  if(!split[2]) split[2] = 'none'
  ctx.View = View

  ctx.state =  split.slice(3, split.length)
  return { route: split[2] }
})

adminViewRouter.on('none', require('../actions/admin/view'))
//adminViewRouter.on('add', require('../actions/admin/view/add'))

adminRouter.on('view', adminViewRouter)

const adminMailRouter = new Router(async (ctx) => {
  const split =  ctx.callbackQuery.data.split('_')

  if(!split[2]) split[2] = 'nothing'
  ctx.Mail = Mail
  
  ctx.state = split.slice(3, split.length)
  return { route: split[2] }
})

adminMailRouter.on('nothing', require('../actions/admin/mail'))
adminMailRouter.on('id', require('../actions/admin/mail'))

adminMailRouter.on('add', require('../actions/admin/mail/add'))

adminMailRouter.on('keyboard', require('../actions/admin/mail/keyboard'))
adminMailRouter.on('lang', require('../actions/admin/mail/lang'))
adminMailRouter.on('quantity', require('../actions/admin/mail/quantity'))
adminMailRouter.on('preview', require('../actions/admin/mail/preview'))
adminMailRouter.on('editPost', require('../actions/admin/mail/editPost'))
adminMailRouter.on('startDate', require('../actions/admin/mail/startDate'))
adminMailRouter.on('delete', require('../actions/admin/mail/delete'))
adminMailRouter.on('action', require('../actions/admin/mail/action'))
adminMailRouter.on('start', require('../actions/admin/mail/start'))
adminMailRouter.on('none', ctx => ctx.answerCbQuery())

adminRouter.on('mail', adminMailRouter)

adminRouter.on('back', require('../actions/admin'))

router.on('admin', adminRouter)

module.exports = router