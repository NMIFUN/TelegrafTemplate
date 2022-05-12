const showView = require('./showView')

module.exports = async (ctx) => {
  await showView(ctx)

  return ctx.replyWithHTML(ctx.i18n.t('start.text'))
}