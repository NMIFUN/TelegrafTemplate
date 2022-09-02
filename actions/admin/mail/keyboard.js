const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if(ctx.state[1]) {
      const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], { keyboard: [] })
      return ctx.replyWithHTML(`Клавиатура удалена`, { 
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(`Продолжить настройку`, `admin_mail_id_${mail._id}`)
        ])
      })
    }
    ctx.user.state = `admin_mail_keyboard_${ctx.state[0]}`

    return ctx.replyWithHTML(`Введите список кнопок в следующем формате:

Кнопка 1 - http://example1.com

<i>с двух сторон от - должны быть пробелы</i>
Используйте разделитель "|", чтобы добавить кнопки в один ряд:

Кнопка 1 - http://example1.com | Кнопка 2 - http://example2.com
Кнопка 3 - http://example3.com | Кнопка 4 - http://example4.com`, { 
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(`Назад`, `admin_mail_id_${ctx.state[0]}`)
      ]),
      parse_mode: "HTML"
    })
  }else{
    const keyboard = []
    try {
      const splitEnter = ctx.message.text.replace(/([-‐−‒­⁃–—―])/g, '-').split('\n')
      for (const i of splitEnter) {
        const tempArr = []
        const splitWand = i.split('|')
        for (const y of splitWand) {
          const splitDash = y.split(' - ')
          
          const key = { text: splitDash[0].trim(), url: splitDash.slice(1).join(' - ').trim() }
          if(!key.text || !key.url) return ctx.reply(`Ошибка при построении клавиатуры`)

          tempArr.push(key)
        }
        keyboard.push(tempArr)
      }
    } catch (error) {
      return ctx.reply(`Ошибка при построении клавиатуры`)
    }
    if(!keyboard.length) return ctx.reply(`Ошибка при построении клавиатуры`)

    ctx.user.state = null

    const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], { keyboard: keyboard })
    return ctx.replyWithHTML(`Клавиатура сохранена`, { 
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(`Продолжить настройку`, `admin_mail_id_${mail._id}`)
      ])
    })
  }
}