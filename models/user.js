const mongoose = require('mongoose')

let User = mongoose.Schema(
    {
        id: {
            type: Number,
            index: true,
            unique: true,
            required: true,
        },
        name: String,
        username: String,
        state: String,
        lang: String,
        ban: {
            type: Boolean,
            default: false,
        },
        langCode: String,
        alive: {
            type: Boolean,
            default: true,
        },
        from: String,
        lastMessage: Date,
    },
    {
        timestamps: true,
    }
)
User = mongoose.model('User', User)

module.exports = User
