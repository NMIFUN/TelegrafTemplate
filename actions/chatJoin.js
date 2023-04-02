const config = require('../config.json')
const convertChars = require('../helpers/convertChars')

const User = require('../models/user')
const Ref = require('../models/ref')

module.exports = async (ctx) => {
  const find = config.joinChannels?.find(
    (channel) => channel.id === ctx.chat.id
  )
  if (!find) return

  let newCount = 1

  try {
    await ctx.telegram.approveChatJoinRequest(ctx.chat.id, ctx.from.id)

    await ctx.telegram.sendMessage(
      ctx.from.id,
      ctx.i18n.t('joinRequest.text'),
      {
        parse_mode: 'HTML'
      }
    )

    await User.create({
      id: ctx.from.id,
      name: convertChars(ctx.from.first_name),
      username: ctx.from.username,
      alive: true,
      from: `chatJoin-${ctx.chat.id}`
    }).catch(() => {
      newCount = 0
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }

  const date = Date.now()

  const name = `ref-chatJoin-${ctx.chat.id}`

  const ref = await Ref.findOne({ name: name })

  if (ref)
    await Ref.updateOne(
      { name: name },
      {
        $inc: {
          count: 1,
          newCount: newCount,
          uniqueCount: Number(ref.users.includes(ctx.from.id))
        },
        $addToSet: { users: ctx.from.id },
        $set: { last: date }
      }
    )
  else
    await Ref.create({
      name: name,
      first: date,
      last: date,
      count: 1,
      uniqueCount: 1,
      newCount: newCount,
      users: [ctx.from.id]
    })
}
