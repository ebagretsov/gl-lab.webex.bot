//Webex Bot Starter - featuring the webex-node-bot-framework - https://www.npmjs.com/package/webex-node-bot-framework
var request = require('request');

var framework = require('webex-node-bot-framework');
var webhook = require('webex-node-bot-framework/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(express.static('images'));
const config = require("./config.json");

// init framework
var framework = new framework(config);
framework.start();
console.log("Starting WebEx Teams Bot, please wait...");

// Starting database
var mysql = require('mysql');

var con = mysql.createConnection({
    host: config.mysql_host,
    user: config.mysql_username,
    password: config.mysql_password,
    database: config.mysql_database
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Database is up and running."); 
});

framework.on("initialized", function () {
  console.log("Bot is up and running! [Press CTRL-C to quit]");
});

//Process incoming messages

let responded = false;
/* On mention with command
ex User enters @botname help, the bot will write back in markdown
*/
framework.hears(/help|what can i (do|say)|what (can|do) you do/i, function (bot, trigger) {
  responded = true;

  console.log(`Someone needs help! They asked ${trigger.text}`);
  bot.say(`Привет, ${trigger.person.displayName}.`)
    .then(() => sendHelp(bot))
    .catch((e) => console.error(`Problem in help hander: ${e.message}`));
});

// Buttons & Cards data
var clientCardJSON = require("./clientCard_1.json");
var dbupdateCardJSON = require("./dbupdateCard.json");

// DNA Center Request
framework.hears('/device', function (bot, trigger) {
  responded = true;
  console.log('/device command recieved');
  dnaRequest('devnetuser', 'Cisco123!', bot);
});

// Update Clients Database
framework.hears('/add', function (bot, trigger) {
    responded = true;
    console.log('/add command recieved');

    dbupdateCardJSON.roomId = bot.room.id;
    bot.sendCard(dbupdateCardJSON, 'Ошибка отображения карточки обновления базы :(');
});

// IOS XE Request
framework.hears('/config', function (bot, trigger) {
  responded = true;

  console.log('/config command recieved');

  headers = {
      "Accept": "application/yang-data+json"
  }

  body = null;
  var options = {
      method: 'GET',
      rejectUnauthorized: false,
      url: 'https://ios-xe-mgmt-latest.cisco.com:9443/restconf/data/Cisco-IOS-XE-native:native',
      headers,
      body,
      auth: {
        user: 'developer',
        password: 'C1sco12345'
      }
  };

  var msg = '**Конфигурация CSR1000v**' + '\n\n ';
  var i = 1;

  request(options, function (error, response) { 
    if (error) throw new Error(error);
    //console.log(response.body);

    let iosconfig = JSON.parse(JSON.stringify(response.body));

    // part 1
    msg += '```\n';
    msg += iosconfig.slice(0,7400);
    msg += '```\n';

    // part 2
    msg2 = '**Часть 2**\n\n```\n';
    msg2 += iosconfig.slice(7401);
    msg2 += '```\n';

    bot.say("markdown", msg)
        .then(() => bot.say("markdown", msg2));

    // clear responded status
    responded = false;
  });
});

/* On mention with unexpected bot command
   Its a good practice is to gracefully handle unexpected input
*/
framework.hears('/find', function (bot, trigger) {
    if (!responded){
        responded = true;

        let argsString = trigger.args.slice(1).join(' ');
        console.log(`Search client for user input: ${argsString}`);
        
        let searchString = argsString.toLowerCase();
        let queryString = `select * from tbl_clients where lower(company_name) like '%${searchString}%' order by company_name`;

        con.query(queryString, function (err, result, fields) {
        
            if (err) {
              logger.error('Error in DB');
              logger.debug(err);
              return;
            } else {
                if (result && result.length) {
                    let rows = JSON.parse(JSON.stringify(result[0]));
                    let numOfRows = Object.keys(result).length;

                    if (numOfRows == 1){
                    
                        // PARTNER INFO
                        clientCardJSON.body[0].columns[0].items[1].isVisible = false; // Hide Nothing Found Text Block
                        clientCardJSON.body[0].columns[0].items[2].isVisible = true;  // Show Client Info Block
                        
                        clientCardJSON.body[0].columns[0].items[0].text = 'Заказчик';

                        clientCardJSON.body[0].columns[0].items[2].columns[1].items[0].text = (rows['company_name'] == null) ? 'N/A' : rows['company_name'];
                        clientCardJSON.body[0].columns[0].items[2].columns[1].items[1].text = (rows['city'] == null) ? 'N/A' : rows['city'];                        

                        if (rows['website'] && rows['website'].length){        
                          clientCardJSON.body[0].columns[0].items[3].items[0].actions[0].title = 'Веб-сайт';
                          clientCardJSON.body[0].columns[0].items[3].items[0].actions[0].url = rows['website'];
                          clientCardJSON.body[0].columns[0].items[3].isVisible = true;  // Show Partner WebSite
                        } else {
                          clientCardJSON.body[0].columns[0].items[3].items[0].actions[0].url = 'https://cisco.com';
                          clientCardJSON.body[0].columns[0].items[3].isVisible = false; // Hide Partner WebSite
                        }

                        // ACCOUNT MANAGER INFO
                        clientCardJSON.body[1].columns[0].items[1].columns[1].items[0].text = (rows['manager'] == null) ? 'N/A' : rows['manager'];
                        clientCardJSON.body[1].columns[0].items[1].columns[1].items[1].text = (rows['email'] == null) ? 'N/A' : rows['email'];
                        clientCardJSON.body[1].columns[0].items[1].columns[1].items[2].text = (rows['phone'] == null) ? 'N/A' : rows['phone'];

                        bot.sendCard(clientCardJSON, 'Ошибка отображения карточки результатов :(');
                    } else {// end if result.lenght = 1
                        var msg = '**Найдено записей: ' + numOfRows + '**\n\n ';
                        msg += '*Клиент, Аккаунт менеджер, Email*' + '\n\n';

                        Object.keys(result).forEach(function(key) {
                            var row = result[key];
                            
                            msg += '**' + 
                                row.company_name + '**, ' + 
                                row.manager + ', ' + 
                                row.email + 
                            '\n';
                        });

                        bot.say("markdown", msg);
                    }      
                } else {
                    // NOTHING FOUND
                    
                    clientCardJSON.body[0].columns[0].items[3].isVisible = false;  // Show Partner WebSite

                    clientCardJSON.body[0].columns[0].items[2].isVisible = false; // Client Info Block
                    clientCardJSON.body[0].columns[0].items[1].isVisible = true;  // Noting Found Text Block

                    clientCardJSON.body[0].columns[0].items[0].text = 'Ничего не найдено';

                    clientCardJSON.body[1].columns[0].items[1].columns[1].items[0].text = 'Aigerim Taizhanova';
                    clientCardJSON.body[1].columns[0].items[1].columns[1].items[1].text = 'ataizhan@cisco.com';
                    clientCardJSON.body[1].columns[0].items[1].columns[1].items[2].text = '+7 707 111 2222';

                    bot.sendCard(clientCardJSON, 'Ошибка отображения карточки результатов :(');
                }

                // clear responded status
                responded = false;
            } 
        })      
    }
});

function sendDeviceList(dnaAuthToken, bot){
  console.log('Sending DNA Center Device list...');

  headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Auth-Token": dnaAuthToken
  }

  body = null;
  var options = {
      method: 'GET',
      rejectUnauthorized: false,
      url: 'https://sandboxdnac.cisco.com/dna/intent/api/v1/network-device',
      headers,
      body
  };

  var msg = '**Список устройств в DNA Center**' + '\n\n ';
  msg += '*№, Имя хоста, IP адрес, Версия ПО, Uptime, Серийный номер*' + '\n';
  var i = 1;

  request(options, function (error, response) { 
    if (error) throw new Error(error);
    let devices = JSON.parse(response.body);

    for(var arr in devices.response){
      msg += '**' + i.toString() + '. ' + 
             devices.response[arr].hostname + '**, ' + 
             devices.response[arr].managementIpAddress + ', ' + 
             devices.response[arr].softwareVersion + ', ' + 
             devices.response[arr].upTime + ', ' + 
             devices.response[arr].serialNumber + 
             '\n';
      i++;
    }

    bot.say("markdown", msg);
    // clear responded status
    responded = false;
  });
}

/*
  Get DNA Center Auth Token for X-Auth-Header API requests
*/
function dnaRequest(username, password, bot) {
  console.log("Getting DNA Center Auth Token...");

  var authString = "Basic " + new Buffer(username + ":" + password).toString("base64");  

  headers = {
      "Content-Type": "application/json",
      "Authorization": authString,
      "Accept": "application/json"
  }

  body = null;

  var options = {
      method: 'POST',
      rejectUnauthorized: false,
      url: 'https://sandboxdnac.cisco.com/dna/system/api/v1/auth/token',
      headers,
      body,
  };

  request(options, function (error, response) { 
      if (error) throw new Error(error);
      getTokenResult = JSON.parse(response.body);
      sendDeviceList(getTokenResult.Token, bot);
  });
}

function sendHelp(bot) {
    responded = true;
    bot.say("markdown", 'Список доступных команд:', '\n\n ' +
        '1. **/find [name]**   Поиск информации о клиенте и аккаунт менеджере в базе данных \n' +
        '2. **/add**   Отобразить форму добавления нового клиента в базу данных \n' +
        '3. **/device**   Список устройств DNA Center \n' + 
        '4. **/config**   Конфигурация IOS XE \n' + 
        '5. **/help**   Справка по командам \n'
    );
    // clear responded status
    responded = false;
}

// All other messages
framework.hears(/.*/, function (bot, trigger) {
    if (!responded){
        responded = true;

        bot.say("markdown", 'Извините, команда *' + trigger.text + '* не найдена. \nИспользуйте **/help** для вывода доступных команд.')
            .then(() => sendHelp(bot))
            .catch((e) => console.error(`Problem in help hander: ${e.message}`));
    }
    // clear responded status
    responded = false;
});

// Reply to a card when a user hits an action.submit button
framework.on('attachmentAction', function(bot, trigger) {
    console.log('New client data recieved');

    let data = JSON.parse(JSON.stringify(trigger.attachmentAction, null, 2));
    
    let _company_name = data.inputs.Name.toUpperCase();
    let _city = data.inputs.City;
    let _website = data.inputs.WebSite;
    let _manager = data.inputs.Manager;
    let _email = data.inputs.Email;
    let _phone = data.inputs.Phone;

    let insertString = `insert into tbl_clients (company_name, city, manager, email, phone, website) VALUES ('${_company_name}', '${_city}', '${_manager}', '${_email}', '${_phone}', '${_website}')`;
    console.log(insertString);

    con.query(insertString, function (err, result, fields) {
    
        if (err) {
          logger.error('Error in DB');
          logger.debug(err);
          return;
        } else {
            console.log('New record saved');
            bot.reply(trigger.attachmentAction, 'Новая запись для клиента *' + _company_name + '* успешно добавлена в базу данных. Используйте **/find [name]** чтобы найти запись.', "markdown");
        }
    });
    
});

//Server config & housekeeping
// Health Check
app.get('/', function (req, res) {
  res.send(`I'm alive.`);
});

app.post('/', webhook(framework));

var server = app.listen(config.port, function () {
  framework.debug('framework listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function () {
  framework.debug('stoppping...');
  server.close();
  framework.stop().then(function () {
    process.exit();
  });
});
