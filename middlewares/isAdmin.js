const config = require('../config')

module.exports = async (ctx, next) => {
  if (config.admins.includes(ctx.from.id)) return next()
}