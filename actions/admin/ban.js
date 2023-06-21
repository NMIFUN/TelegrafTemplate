const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const User = require('../../models/user.js')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_ban'

    return ctx.editMessageText(
      'Для добавления/удаления в/из бан(а) введите его id или перешлите сообщение.',
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML'
      }
    )
  } else {
    const id = ctx.message.forward_from
      ? ctx.message.forward_from.id
      : Number(ctx.message.text)

    const user = await User.findOne({ id }).catch(() => {})

    if (!user)
      return ctx.reply(`Пользователь с id ${id} не найден.`, admin.backKeyboard)

    if (config.admins.includes(user.id))
      return ctx.replyWithHTML('Нельзя забанить админа')

    ctx.user.state = null

    user.ban = !user.ban
    await user.save()

    return ctx.replyWithHTML(
      `Пользователь ${user.name} ${user.ban ? 'забанен' : 'разбанен'}.`,
      admin.backKeyboard
    )
  }
}
