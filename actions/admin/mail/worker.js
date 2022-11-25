/* eslint-disable no-unused-vars */
function r() {}
;(async () => {
    const { parentPort, workerData } = require('worker_threads')
    const mongoose = require('../../../models')

    const Mail = require('../../../models/mail')
    const User = require('../../../models/user')
    const sleep = (millis) =>
        new Promise((resolve) => setTimeout(resolve, millis))

    const { Telegraf } = require('telegraf')
    const bot = new Telegraf(process.env.BOT_TOKEN)

    let mail = await Mail.findById(workerData)

    const mailConfig = {
        alive: true,
    }
    if (mail.lang !== null) mailConfig.lang = mail.lang

    const users = await User.find(mailConfig, { id: 1 })
        .skip(mail.success + mail.unsuccess)
        .limit(
            (mail.quantity && mail.quantity - mail.success + mail.unsuccess) ||
                10000000
        )

    mail.status = 'doing'
    if (mail.success + mail.unsuccess === 0) {
        mail.startDate = Date.now()
        mail.all = users.length
    }
    await mail.save()

    const message = mail.message
    const message1 = { ...mail.message, chat: {} }

    let promises = []
    let died = []
    let alive = []

    for (let i = 0; i < users.length; i++) {
        const user = users[i]

        promises.push(
            bot.telegram
                .sendCopy(user.id, i % 2 === 0 ? message : message1, {
                    reply_markup: {
                        inline_keyboard: mail.keyboard,
                    },
                    disable_web_page_preview: !mail.preview,
                })
                .then(() => {
                    mail.success++

                    alive.push(user.id)
                })
                .catch(async (e) => {
                    Number.isInteger(mail.errorsCount[e.description])
                        ? mail.errorsCount[e.description]++
                        : (mail.errorsCount[e.description] = 1)

                    if (e.description.startsWith('Too Many Requests:')) {
                        await sleep(parseInt(e.description.match(/\d+/)) * 1000)
                        i--
                    } else {
                        mail.unsuccess++

                        died.push(user.id)
                    }
                })
        )

        if (i % 10 === 0) {
            await Promise.all(promises)
            promises = []
            await sleep(160)
        }

        if (i % 100 === 0) {
            const mailUpd = await Mail.findByIdAndUpdate(workerData, {
                success: mail.success,
                unsuccess: mail.unsuccess,
                errorsCount: mail.errorsCount,
            })

            await User.updateMany({ id: { $in: died } }, { alive: false })
            died = []

            await User.updateMany({ id: { $in: alive } }, { alive: true })
            alive = []

            if (mailUpd.status === 'paused' || mailUpd.status === 'stopped')
                return parentPort.postMessage('stop')
        }
    }

    await Promise.all(promises)
    await User.updateMany({ id: { $in: died } }, { alive: false })
    await User.updateMany({ id: { $in: alive } }, { alive: true })

    await Mail.findByIdAndUpdate(workerData, {
        endDate: Date.now(),
        status: 'ended',
        success: mail.success,
        unsuccess: mail.unsuccess,
        all: mail.success + mail.unsuccess,
        errorsCount: mail.errorsCount,
    })

    parentPort.postMessage('complete')
})()
