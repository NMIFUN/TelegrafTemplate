const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    ctx.user.state = `admin_addAdmin`
    return ctx.editMessageText(`Введите <b>id</b> администратора\n\nТекущий список: ${config.admins.join(', ')}`, { 
      ...admin.backKeyboard,
      parse_mode: "HTML"
    })
  }else{
    ctx.user.state = null

    const list = ctx.message.text.split(',')
    for (let i of list) {
      i = i.trim()
      if(!config.admins.includes(i)) config.admins.push(Number(i))
    }
    await fs.writeFile('../../config.json', JSON.stringify(config))

    return ctx.replyWithHTML(`Список администраторов обновлен\n\nТекущий список: ${config.admins.join(', ')}`, admin.backKeyboard)
  }
}