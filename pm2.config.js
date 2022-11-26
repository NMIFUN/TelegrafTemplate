require("dotenv").config({ path: `${__dirname}/.env` })

module.exports = {
    apps: [
        {
            name: process.env.BOT_USERNAME,
            script: "index.js",
            watch: true,
            ignore_watch: ["config.json", "logs"],
        },
    ],
}
