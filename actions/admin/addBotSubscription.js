const { Markup } = require('telegraf')
const fs = require('fs').promises

const config = require('../../config.json')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (!config.subsBots) config.subsBots = []
  config.subsBots = config.subsBots.filter((e) => e.url)

  if (
    (!ctx.state[0] && ctx.user.state === 'admin_aBS') ||
    ctx.state[1] === 'delete'
  ) {
    const list = (
      ctx.message?.text?.split(' ') || [ctx.state[0], ctx.state[1]]
    ).map((e) => e?.trim())

    const find = config.subsBots.findIndex((e) => e.name === list[0])
    if (find !== -1) {
      config.subsBots.splice(find, 1)

      await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

      await ctx.replyWithHTML(`${list[0]} удален`)
    } else {
      if (!list[0] || list[0].length > 7)
        return ctx.replyWithHTML(`Название не может вмещать больше 7 символов`)

      if (!list[1] || !list[1].startsWith('t.me'))
        return ctx.replyWithHTML(`Ссылка должна начинаться с <i>t.me</i>!`)

      if (list[3] && list[3].length > 3)
        return ctx.replyWithHTML(`Неверный языковой код`)

      const object = {
        name: list[0],
        url: list[1],
        token: list[3] ? list[2] : list[2]?.length <= 3 ? undefined : list[2],
        lang: list[3] ? list[3] : list[2]?.length <= 3 ? list[2] : undefined,
        type: 'bot'
      }
      config.subsBots.push(object)

      await ctx[ctx.message ? 'reply' : 'editMessageText'](
        `<b>${object.name}</b> ${object.url} ${
          object.token ?? '(token отсутствует)'
        } ${object.lang ?? '(язык отсутствует)'} добавлен`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      )
    }

    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    ctx.state = ['new']
  }

  ctx.user.state = 'admin_aBS'

  if (ctx.state[0] === 'new') await ctx.deleteMessage()

  return ctx[
    ctx.message || ctx.state[0] === 'new' ? 'reply' : 'editMessageText'
  ](
    `${config.subsBots
      .map(
        (e) =>
          `<b>${e.name}</b> ${e.url} ${e.token ?? '(id отсутствует)'} ${
            e.lang ?? '(язык отсутствует)'
          }`
      )
      .join('\n')}

Для добавления <b>бота</b> на обязательную подписку: 
<i>Введите название, рекламную ссылку (если нужно token из @botfather или токен из @BotMembersRobot) и (если нужно язык) через пробел</i>

Для удаления нажмите на кнопку ниже`,
    Markup.inlineKeyboard(
      [
        ...config.subsBots.map((e) =>
          Markup.callbackButton(e.name, `${ctx.user.state}_${e.name}_delete`)
        ),
        Markup.callbackButton('‹ Назад', 'admin_back')
      ],
      { columns: 2 }
    ).extra({
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  )
}
