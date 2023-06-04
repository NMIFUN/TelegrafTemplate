const { Markup } = require('telegraf')
const fs = require('fs').promises

const config = require('../../config.json')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (!config.subsChannels) config.subsChannels = []
  config.subsChannels = config.subsChannels.filter((e) => e.url)

  if (ctx.state[1]) {
    const code = ctx.message?.text ?? 's'

    if (code > 3) return ctx.replyWithHTML(`Неверный языковой код`)

    const object = {
      name: ctx.state[0].split(':')[0],
      url: ctx.state[0].split(':')[1],
      lang: code !== 's' ? code : undefined
    }

    if (ctx.state[1] !== 's') {
      const getChat = await ctx.telegram.getChat(ctx.state[1])

      object.id = getChat.id
    }
    config.subsChannels.push(object)

    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    await ctx[ctx.message ? 'reply' : 'editMessageText'](
      `<b>${object.name}</b> ${object.url} ${object.id ?? '(id отсутствует)'} ${
        object.lang ?? '(язык отсутствует)'
      } добавлен`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    )

    ctx.state = ['new']
  }

  if (
    ctx.state[0] &&
    ctx.state[0] !== 'new' &&
    ctx.state[0]?.split(':')[1] !== 'delete'
  ) {
    let getChat

    if (ctx.callbackQuery) getChat = 's'
    else {
      const id = ctx.message.forward_from_chat
        ? ctx.message.forward_from_chat.id
        : isNaN(ctx.message.text)
        ? ctx.message.text.replace(
            /((https?:\/\/)?t(elegram)?\.me\/|\w+.t(elegram)?)/,
            '@'
          )
        : Number(ctx.message.text)

      try {
        getChat = (await ctx.telegram.getChat(id)).id
      } catch (e) {
        return ctx.replyWithHTML('Неверный канал/чат или не добавлен бот')
      }
    }

    await ctx[ctx.message ? 'reply' : 'editMessageText'](
      `<b>${ctx.state[0].split(':')[0]}</b> ${ctx.state[0].split(':')[1]} ${
        getChat === 's' ? '(id отсутствует)' : getChat
      }

Введите языковой код (если нужно)`,
      Markup.inlineKeyboard([
        [Markup.callbackButton('Пропустить', `${ctx.user.state}_${getChat}`)],
        [Markup.callbackButton('‹ Назад', ctx.user.state)]
      ]).extra({ parse_mode: 'HTML', disable_web_page_preview: true })
    )

    return (ctx.user.state = `${ctx.user.state}_${getChat}`)
  }

  if (
    (!ctx.state[0] && ctx.user.state === 'admin_addSubscription') ||
    ctx.state[0]?.split(':')[1] === 'delete'
  ) {
    const list = ctx.message?.text?.split(' ') || ctx.state[0]?.split(':')

    const find = config.subsChannels.findIndex((e) => e.name === list[0])
    if (find !== -1) {
      config.subsChannels.splice(find, 1)

      await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

      await ctx.replyWithHTML(`${list[0]} удален`)

      ctx.state = ['new']
    } else {
      if (!list[0] || !list[0].length > 7)
        return ctx.replyWithHTML(`Название не может вмещать больше 7 символов`)

      if (
        !list[1] ||
        (!list[1].startsWith('http') && !list[1].startsWith('t.me'))
      )
        return ctx.replyWithHTML(
          `Ссылка должна начинаться с <i>http</i> или <i>t.me</i>!`
        )

      await ctx.replyWithHTML(
        `<b>${list[0]}</b> ${list[1]}

Введите id или @username или перешлите пост из канала`,
        Markup.inlineKeyboard([
          [
            Markup.callbackButton(
              'Пропустить',
              `${ctx.user.state}_${list[0]}:${list[1]}`
            )
          ],
          [Markup.callbackButton('‹ Назад', ctx.user.state)]
        ]).extra({ disable_web_page_preview: true })
      )

      return (ctx.user.state = `${ctx.user.state}_${list[0]}:${list[1]}`)
    }
  }

  ctx.user.state = 'admin_addSubscription'

  if (ctx.state[0] === 'new') await ctx.deleteMessage()

  return ctx[
    ctx.message || ctx.state[0] === 'new' ? 'reply' : 'editMessageText'
  ](
    `${config.subsChannels.map(
      (e) =>
        `<b>${e.name}</b> ${e.url} ${e.id ?? '(id отсутствует)'} ${
          e.lang ?? '(язык отсутствует)'
        }`
    )}

Для добавления <b>канала/группы</b> на обязательную подписку: 
<i>Введите название и рекламную ссылку через пробел</i>

Для удаления нажмите на кнопку ниже`,
    Markup.inlineKeyboard(
      [
        ...config.subsChannels.map((e) =>
          Markup.callbackButton(e.name, `${ctx.user.state}_${e.name}:delete`)
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
