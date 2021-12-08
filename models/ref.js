const mongoose = require('mongoose')

let Ref = mongoose.Schema({
	name: String,
	first: Date,
	last: Date,
	all: Number,
	uniqueCount: Number,
	newCount: Number,
	users: Array
})
Ref = mongoose.model('Ref', Ref)

module.exports = Ref