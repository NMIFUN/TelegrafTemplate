const Markup = require('telegraf/markup')

const text = `Текст админки`
const keyboard = Markup.inlineKeyboard([
  Markup.callbackButton(`Рассылка`, `admin_mailing`),
  Markup.callbackButton(`Просмотры`, `admin_views`),
  Markup.callbackButton(`Список пользователей`, `admin_listUsers`),
  Markup.callbackButton(`Админы`, `admin_addAdmin`),
  Markup.callbackButton(`Обязательная подписка`, `admin_addSubscription`),
], { columns: 2 }).extra()
const backKeyboard = Markup.inlineKeyboard([
  Markup.callbackButton(`Назад`, `admin_back`)
], { columns: 2 }).extra()

module.exports = { text: text, keyboard: keyboard, backKeyboard: backKeyboard }