const Markup = require('telegraf/markup')
const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
}
const { ObjectId } = require('mongodb')
const statuses = {
  stopped: '⏹ Рассылка остановлена',
  paused: '⏸ Рассылка приостановлена',
  ended: '📬 Рассылка завершена',
  doing: '🕒 Рассылка выполняется',
  notStarted: '🛠 Рассылка еще не начата'
}

const parts = [
  '▓▓▓▓▓▓▓▓▓▓',
  '█▓▓▓▓▓▓▓▓▓',
  '██▓▓▓▓▓▓▓▓',
  '███▓▓▓▓▓▓▓',
  '████▓▓▓▓▓▓',
  '█████▓▓▓▓▓',
  '██████▓▓▓▓',
  '███████▓▓▓',
  '████████▓▓',
  '█████████▓',
  '██████████'
]

module.exports = async (ctx) => {
  let a

  if (!ctx.state[0]) a = 0
  else if (isNaN(ctx.state[0])) {
    a =
      (await ctx.Mail.countDocuments({
        _id: { $gte: ObjectId(ctx.state[0]) }
      })) - 1
  } else a = Number(ctx.state[0])

  if (a < 0) return ctx.answerCbQuery('Нельзя', true)

  const count = await ctx.Mail.countDocuments()
  if (a !== 0 && a + 1 > count) return ctx.answerCbQuery('Нельзя', true)

  await ctx.answerCbQuery()

  ctx.user.state = null

  if (count === 0) {
    return ctx.editMessageText('Нет рассылок', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.callbackButton('Добавить', 'admin_mail_add')],
        [Markup.callbackButton('‹ Назад', 'admin_back')]
      ]),
      parse_mode: 'HTML'
    })
  } else {
    await ctx.deleteMessage().catch(() => {})
    const result = await ctx.Mail.findOne().skip(a).sort({ _id: -1 })

    let extraKeyboard = [
      [
        Markup.callbackButton('◀️', `admin_mail_id_${a - 1}`),
        Markup.callbackButton('🔄', `admin_mail_id_${a}`),
        Markup.callbackButton('▶️', `admin_mail_id_${a + 1}`)
      ],
      [Markup.callbackButton(statuses[result.status], 'admin_mail_none')]
    ]

    if (result.status === 'notStarted') {
      extraKeyboard = extraKeyboard.concat([
        [
          Markup.callbackButton(
            `🔘 Кнопки ${result.keyboard.length ? '✅' : '❌'}`,
            `admin_mail_keyboard_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_mail_keyboard_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🫂 Получателей ${result.quantity === 0 ? 'все' : result.quantity}`,
            `admin_mail_quantity_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_mail_quantity_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🏳️ Язык ${result.lang === null ? 'все' : result.lang}`,
            `admin_mail_lang_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_mail_lang_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `⏱ Время ${
              result.startDate
                ? new Date(result.startDate).toLocaleString('ru', dateConfig)
                : '❌'
            }`,
            `admin_mail_startDate_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_mail_startDate_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🌐 Превью ${result.preview ? '✅' : '❌'}`,
            `admin_mail_preview_${result._id}`
          ),
          Markup.callbackButton(
            '📃 Изменить пост',
            `admin_mail_editPost_${result._id}`
          )
        ],
        [
          Markup.callbackButton(
            '🚀 Начать рассылку',
            `admin_mail_start_${result._id}`
          )
        ]
      ])
    } else {
      const processKeyboard = [
        [
          Markup.callbackButton(
            `📬 Успешно ${result.success}`,
            'admin_mail_none'
          ),
          Markup.callbackButton(
            `📫 Неуспешно ${result.unsuccess}`,
            'admin_mail_none'
          )
        ],
        [
          Markup.callbackButton(
            `🕰 Длительность ${parseInt(
              ((result.endDate ? result.endDate : Date.now()) -
                result.startDate) /
                (1000 * 60)
            ).toFixed(1)} мин.`,
            'admin_mail_none'
          )
        ]
      ]

      if (result.status === 'doing') {
        processKeyboard.push([
          Markup.callbackButton(
            '⏸ Приостановить',
            `admin_mail_action_${result._id}_pause`
          ),
          Markup.callbackButton(
            '⏹ Остановить',
            `admin_mail_action_${result._id}_stop`
          )
        ])
      } else if (result.status === 'paused') {
        processKeyboard.push([
          Markup.callbackButton(
            '▶️ Продолжить',
            `admin_mail_action_${result._id}_continue`
          ),
          Markup.callbackButton(
            '⏹ Остановить',
            `admin_mail_action_${result._id}_stop`
          )
        ])
      }
      extraKeyboard = extraKeyboard.concat(processKeyboard)
    }

    extraKeyboard = extraKeyboard.concat([
      [
        Markup.switchToChatButton('✈️ Поделиться', `mail_${result._id}`),
        Markup.callbackButton('🗑 Удалить', `admin_mail_delete_${result._id}`)
      ],
      [
        Markup.callbackButton('Добавить рассылку', 'admin_mail_add'),
        Markup.callbackButton('‹ Назад', 'admin_back')
      ]
    ])
    const keyboard = result.keyboard.concat(extraKeyboard)

    const procent = (result.success + result.unsuccess) / result.all
    const time = new Date()
    time.setSeconds(
      time.getSeconds() +
        (result.all - result.success - result.unsuccess) * 0.016
    )

    const text = `${statuses[result.status]}

${
  result.status === 'notStarted'
    ? result.startDate
      ? `Запланирована на ${new Date(result.startDate).toLocaleString(
          'ru',
          dateConfig
        )}`
      : 'Не запланирована'
    : `${
        result.status !== 'completed'
          ? `🏃 Прогресс выполнения: [${parts[Math.round(procent * 10)]}] - ${
              result.success + result.unsuccess
            }/${result.all} - ${Math.floor(procent * 100)}%`
          : ''
      }

📊 Статистика:
📬 Успешно: ${result.success}
📭 Неуспешно: ${result.unsuccess}

${
  ctx.from.id === 305544740
    ? `⚠️ Ошибки: ${Object.entries(result.errorsCount)
        .map(([key, value]) => `${key} ${value}`)
        .join(', ')}\n`
    : ''
}
${
  result.status === 'doing'
    ? `⌚️ Окончание через ≈${Math.round(
        (time - new Date()) / (1000 * 60)
      )} мин.`
    : result.status !== 'notStarted'
    ? `🕰 Длительность ${Math.round(
        ((result.endDate ? new Date(result.endDate) : new Date()) -
          new Date(result.startDate)) /
          (1000 * 60)
      )} мин.`
    : ''
}
`
}`
    delete result.message.chat

    if (result.status === 'notStarted') {
      return ctx.telegram.sendCopy(ctx.from.id, result.message, {
        reply_markup: Markup.inlineKeyboard(keyboard),
        disable_web_page_preview: !result.preview
      })
    } else {
      return ctx.replyWithHTML(text, {
        reply_markup: Markup.inlineKeyboard(keyboard)
      })
    }
  }
}
