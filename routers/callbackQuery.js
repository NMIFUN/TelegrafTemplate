const { Router } = require('telegraf')

const router = new Router(async (ctx) => {
  const split =  ctx.callbackQuery.data.split('_')

  return { route: split[0], state: split.splice(1, split.length) }
})

const translateBot = require('../actions/translateBot')
router.on('translateBot', translateBot)

const subscription = require('../middlewares/subscription')
router.on('subscription', subscription)

const adminRouter = new Router(async (ctx) => {
  const split =  ctx.callbackQuery.data.split('_')

  return { route: split[1], state: split.splice(2, split.length) }
})

const addAdmin = require('../actions/admin/addAdmin')
adminRouter.on('addAdmin', addAdmin)

const addSubscription = require('../actions/admin/addSubscription')
adminRouter.on('addSubscription', addSubscription)

const listUsers = require('../actions/admin/listUsers')
adminRouter.on('listUsers', listUsers)

const views = require('../actions/admin/views')
adminRouter.on('views', views)

const adminBack = require('../actions/admin')
adminRouter.on('back', adminBack)

router.on('admin', adminRouter)

module.exports = router