const mongoose = require('mongoose')

let View = mongoose.Schema({
	message: Object,
  keyboard: Array,
  startDate: Date,
  endDate: Date,
  status: String,
  views: Number,
  unique: Boolean,
  users: Array
})
View = mongoose.model('View', View)

module.exports = View