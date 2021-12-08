const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    ctx.user.state = `admin_addSubscription`
    return ctx.editMessageText(`Введите канал/чат в формате (id/@username ссылка) на подписку\n\nТекущий список: ${config.subsChannels.map(e => e.title).join(", ")}`, { 
      ...admin.backKeyboard,
      parse_mode: "HTML"
    })
  }else{
    const list = ctx.message.text.split(' ')

    try {
      var getChat = await ctx.telegram.getChat(list[0])
    } catch (e) {
      return ctx.replyWithHTML(`Неверный канал/чат`)
    }
    
    ctx.user.state = null

    config.subsChannels.push({
      link: list[1],
      title: getChat.title,
      id: getChat.id
    })

    await fs.writeFile('../../config.json', JSON.stringify(config))

    return ctx.replyWithHTML(`Список каналов/чатов на подписку обновлен\n\nТекущий список: ${config.subsChannels.map(e => e.title).join(", ")}`, admin.backKeyboard)
  }
}