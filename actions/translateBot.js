const subscription = require('../middlewares/subscription')

module.exports = async (ctx, next) => {
  if (ctx.callbackQuery) {
    ctx.user.lang = ctx.callbackQuery.data.split('_')[1]
    ctx.i18n.locale(ctx.user.lang)

    await ctx.answerCbQuery()
    await ctx.editMessageText(ctx.i18n.t('languageSet'))

    await ctx.replyWithHTML(ctx.i18n.t('start.text'))

    ctx.updateType = 'message'
    return subscription(ctx, next)
  } else {
    if (ctx.chat.type !== 'private') return

    if (ctx.message?.text.startsWith('/lang') || !ctx.user?.lang) {
      const langKeyboard = require('../helpers/language')

      return ctx.replyWithHTML(
        'Здравствуйте, выберите язык для использования бота.\nHello, select the language for using the bot.',
        langKeyboard.extra()
      )
    } else return next()
  }
}
