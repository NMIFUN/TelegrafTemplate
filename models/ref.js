const mongoose = require('mongoose')

let Ref = mongoose.Schema({
	name: { type: String, index: true, unique: true },
	first: Date,
	last: Date,
	count: Number,
	uniqueCount: Number,
	newCount: Number,
	users: Array
})
Ref = mongoose.model('Ref', Ref)

module.exports = Ref