const mongoose = require('mongoose')

let User = mongoose.Schema({
	id: {
    type: Number,
    index: true,
    unique: true,
    required: true
  },
	name: String,
	username: String,
	state: String,
	ban: Boolean,
	lang: String,
	langCode: String,
	alive: Boolean,
  from: String,
  lastMessage: Date
}, {
  timestamps: true
})
User = mongoose.model('User', User)

module.exports = User
