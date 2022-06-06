const User = require('../models/user')
const config = require('../config')
const axios = require('axios')
const FormData = require('form-data')
const { Readable } = require('stream')
const fs = require('fs')

module.exports = async () => {
  if(!config.botStat) return

  const users = await User.find({}, '-_id id').lean()
  const content = users.map((value) => Object.values(value).join(';')).join('\n')

  const formData = new FormData()
  formData.append('file', Buffer.from(content, 'utf8'))

  const axiosConfig = {
    method: 'post',
    url: `https://api.botstat.io/create/${process.env.BOT_TOKEN}?notify_id=${config.admins[0]}`,
    headers: {
      ...formData.getHeaders()
    },
    data: formData
  }
  const responce = await axios(axiosConfig)

  return
}