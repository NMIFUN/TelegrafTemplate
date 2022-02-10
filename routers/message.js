const { Router } = require('telegraf')
const config = require('../config')
const View = require('../models/view')
const Mail = require('../models/mail')

const router = new Router(async (ctx) => {
  if(ctx.chat.type !== 'private') return

  const route = (ctx.message?.text?.startsWith('/')) ? 'command' :
  (ctx.user.state) ? 'state' : 
  'else'

  return { route: route }
})

const adminRouter = new Router(async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const cmd = ctx.user.state.split('_')
  return { route: cmd[1], state: cmd.splice(2, cmd.length) }
})

const commandRouter = new Router(async (ctx) => {
  const cmd = ctx.message.text.replace('/', '').split(' ')

  return { route: cmd[0], state: cmd.splice(1, cmd.length) }
})

commandRouter.on('admin', require('../actions/admin'))

commandRouter.on('start', require('../actions/start'))

commandRouter.on('lang', require('../actions/translateBot'))

router.on('command', commandRouter)

const stateRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  return { route: cmd[0], state: cmd.splice(1, cmd.length) }
})

adminRouter.on('addAdmin', require('../actions/admin/addAdmin'))

adminRouter.on('addSubscription', require('../actions/admin/addSubscription'))

const adminMailRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.Mail = Mail
  
  ctx.state = cmd.slice(3, cmd.length)
  return { route: cmd[2] }
})

adminMailRouter.on('add', require('../actions/admin/mail/add'))

adminMailRouter.on('keyboard', require('../actions/admin/mail/keyboard'))
adminMailRouter.on('lang', require('../actions/admin/mail/lang'))
adminMailRouter.on('quantity', require('../actions/admin/mail/quantity'))
adminMailRouter.on('editPost', require('../actions/admin/mail/editPost'))
adminMailRouter.on('startDate', require('../actions/admin/mail/startDate'))

adminRouter.on('mail', adminMailRouter)

stateRouter.on('admin', adminRouter)

router.on('state', stateRouter)

router.on('else', (ctx) => ctx.reply('🌯'))

module.exports = router