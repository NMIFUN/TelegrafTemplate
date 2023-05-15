const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addBotSubscription'

    return ctx.editMessageText(
      `Для добавления бота на обязательную подписку введите его токен и ссылку (и код языка если нужно) через пробел\nПример: 
<code>(297213:asdoiashd или <a href='https://t.me/BotMembersRobot'>d60d56d3-4bd6-4a68-9434-22g7055b2b8f</a>) https://t.me/bot?start=ref</code>
<code>(297213:asdoiashd или <a href='https://t.me/BotMembersRobot'>d60d56d3-4bd6-4a68-9434-22g7055b2b8f</a>) https://t.me/bot?start=ref ru</code>

Для удаления бота из обязательной подписки введите его id\n
Текущий список каналов/чатов на обязательную подписку: ${config.subsBots
        ?.map(
          (e) =>
            `<a href='${e.link}'>${e.id}</a> ${e.lang} (<code>${e.id}</code>)`
        )
        .join(', ')}`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (!config.subsBots?.length) config.subsBots = []

    const id = Number(list[0].split(':')[0])
    let find = config.subsBots.findIndex((o) => o.id === id || list[0] === o.id)
    if (find !== -1) config.subsBots.splice(find, 1)
    else {
      if (!list[1]) {
        return ctx.replyWithHTML(
          'Не указана ссылка на бот.',
          admin.backKeyboard
        )
      }

      find = config.subsBots.findIndex((o) => o.id === id || list[0] === o.id)
      if (find === -1) {
        config.subsBots.push({
          link: list[1],
          id: isNaN(id) ? list[0] : id,
          lang: list[2] || 'all',
          token: !isNaN(id) ? list[0] : undefined
        })
      } else config.subsBots.splice(find, 1)
    }

    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    return ctx.replyWithHTML(
      `Список ботов на обязательную подписку обновлен.\n
Текущий список: ${config.subsBots
        .map(
          (e) =>
            `<a href='${e.link}'>${e.id}</a> ${e.lang} (<code>${e.id}</code>)`
        )
        .join(', ')}`,
      {
        ...admin.backKeyboard,
        disable_web_page_preview: true
      }
    )
  }
}
