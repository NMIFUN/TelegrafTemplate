function r(){}
(async () => {
	const { parentPort, workerData } = require('worker_threads')
  const mongoose = require("../../../models")

  const Mail = require('../../../models/mail')
  const User = require('../../../models/user')
  const sleep = (millis) => new Promise(resolve => setTimeout(resolve, millis))

  const { Telegraf } = require('telegraf')
  const bot = new Telegraf(process.env.BOT_TOKEN)

  let mail = await Mail.findById(workerData)
  
  const mailConfig = {
    alive: true
  }
  if(mail.lang !== null) mailConfig.lang = mail.lang

  const users = await User.find(mailConfig, { id: 1 }).skip(mail.success + mail.unsuccess).limit(mail.quantity)
  mail.status = 'doing'
  if(mail.success + mail.unsuccess === 0) mail.startDate = Date.now()
  await mail.save()

  for (const user of users) {
    await bot.telegram.sendCopy(user.id, mail.message, { reply_markup: {
			inline_keyboard: mail.keyboard
		}, disable_web_page_preview: !mail.preview }).then((r) => { mail.success++ }).catch((e) => {
			(Number.isInteger(mail.errorsCount[e.description])) ? mail.errorsCount[e.description] ++ : mail.errorsCount[e.description] = 1
			mail.unsuccess++
		})
    if(Number.isInteger((mail.success + mail.unsuccess) / 100)) {
      const mailUpd = await Mail.findByIdAndUpdate(workerData, {
        success: mail.success,
        unsuccess: mail.unsuccess,
        errorsCount: mail.errorsCount
      })
      if(mailUpd.status === 'paused' || mailUpd.status === 'stopped') return parentPort.postMessage('stop')
    }
  }

  await Mail.findByIdAndUpdate(workerData, { endDate: Date.now(), status: 'ended' })

  parentPort.postMessage('complete')
})()