const { Markup } = require('telegraf')
const config = require('../../config.json')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (ctx.message?.text) {
    ctx.user.state = null

    config.gramads = ctx.message.text

    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  }

  ctx.user.state = 'admin_gramads'

  return ctx[ctx.message ? 'replyWithHTML' : 'editMessageText'](
    `Gramads ключ

Текущий ключ: ${
      config.gramads || 'нет'
    } (<a href='gramads.net'>получение ключа</a>)`,
    Markup.inlineKeyboard([
      [Markup.callbackButton('‹ Назад', 'admin_back')]
    ]).extra({ parse_mode: 'HTML' })
  )
}
