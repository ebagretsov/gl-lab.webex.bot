## Bot Example using Webex Teams Bot Framework for Node JS

## Tested on:

- [ ] node.js v12.18.3 & npm 6.14.6

- [ ] MySQL 5.7.31, for Linux (x86_64)


----

## Steps to get the bot working

1. Create a Webex Teams bot (save the API access token and username): https://developer.webex.com/my-apps/new/bot

2. Deploy NodeJS + MySQL server + mysql driver for NodeJS

3. Create a new database structure using `db.sql`

4. Create a new clone of https://github.com/webex/webex-node-bot-framework#installation

5. Copy the `config-template.json` file to a file called `config.json`

6. Edit `config.json` with the following values:

* token - Set this to the token for your bot that you got in step 2
* port - Set this to the port of your NodeJS server
* webhookUrl - Set this to the ip address of your NodeJS server
* mysql_ - MySQL Database connection information

7. Copy this git project files to your project directory

8. Turn on your bot server with ```node bot.js```

9. Create a space in Webex Teams

10. Add the bot (by its username) to the space in Webex Teams

11. Send /help message to start using bot
