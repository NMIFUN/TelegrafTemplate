const Markup = require("telegraf/markup")

module.exports = async (ctx) => {
    if (ctx.updateType === "callback_query") {
        await ctx.answerCbQuery()
        await ctx.deleteMessage()

        if (ctx.state[1]) {
            const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
                $unset: { startDate: 1 },
            })
            return ctx.replyWithHTML(`Время удалено`, {
                reply_markup: Markup.inlineKeyboard([
                    Markup.callbackButton(
                        `Продолжить настройку`,
                        `admin_mail_id_${mail._id}`
                    ),
                ]),
            })
        }

        ctx.user.state = `admin_mail_startDate_${ctx.state[0]}`

        return ctx.replyWithHTML(
            `Введите дату и время начала рассылки.\n\nПример: 2022.09.26 12:30`,
            {
                reply_markup: Markup.inlineKeyboard([
                    Markup.callbackButton(
                        `‹ Назад`,
                        `admin_mail_id_${ctx.state[0]}`
                    ),
                ]),
                parse_mode: "HTML",
            }
        )
    } else {
        try {
            var mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
                startDate: new Date(ctx.message.text),
            })
        } catch (error) {
            return ctx.reply(`Ошибка при сохранении: ${error}`)
        }

        ctx.user.state = null

        return ctx.replyWithHTML(`Дата и время рассылки сохранено`, {
            reply_markup: Markup.inlineKeyboard([
                Markup.callbackButton(
                    `Продолжить настройку`,
                    `admin_mail_id_${mail._id}`
                ),
            ]),
        })
    }
}
