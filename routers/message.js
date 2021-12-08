const { Router } = require('telegraf')

const router = new Router(async (ctx) => {
  if(ctx.chat.type !== 'private') return

  const route = (ctx.message?.text.startsWith('/')) ? 'command' :
  (ctx.user.state) ? 'state' : 
  'else'

  return { route: route }
})

const adminRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  return { route: cmd[1], state: cmd.splice(2, cmd.length) }
})

const commandRouter = new Router(async (ctx) => {
  const cmd = ctx.message.text.replace('/', '').split(' ')

  return { route: cmd[0], state: cmd.splice(1, cmd.length) }
})

const admin = require('../actions/admin')
commandRouter.on('admin', admin)

const start = require('../actions/start')
commandRouter.on('start', start)

const translateBot = require('../actions/translateBot')
commandRouter.on('lang', translateBot)

router.on('command', commandRouter)

const stateRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  return { route: cmd[0], state: cmd.splice(1, cmd.length) }
})

const addAdmin = require('../actions/admin/addAdmin')
adminRouter.on('addAdmin', addAdmin)

const addSubscription = require('../actions/admin/addSubscription')
adminRouter.on('addSubscription', addSubscription)

stateRouter.on('admin', adminRouter)

router.on('state', stateRouter)

router.on('else', (ctx) => ctx.reply('🌯'))
module.exports = router