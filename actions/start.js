module.exports = async (ctx) => {
  return ctx.replyWithHTML(ctx.i18n.t('start.text'))
}