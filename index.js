
// Packages
const Discord = require('discord.js');
const client = new Discord.Client({ intents: Discord.Intents.PRIVILEGED, allowedMentions: {repliedUser: false} });
const commandhandler = require('./CommandHandler');
const colors = require("colors");
const figlet = require('figlet');
const rbx = require('noblox.js');
const Humanize = require('humanize-plus');
// Configuration
const {
    token,
    prefix, 
    cookie
} = require('./config.json');


const CommandHandler = new commandhandler(
    client,
    prefix // Bot prefix to default to...
    // './commands' defaults you can change if you wish... these are defined at the command handler level.
    // './events'
);

Object.defineProperty(client, "CommandHandler", {
    enumerable: false,
    writable: true,
    value: CommandHandler
  });
  Object.defineProperty(client, "config", {
    enumerable: false,
    writable: true,
    value: require('./config.json')
  });
client.getBloodlines = function getBloodlines(a) {
const bloodlines = client.db.prepare('SELECT * FROM Bloodlines').all();
const mergeDedupe = (arr) => {
  return [...new Set([].concat(...arr))];
}
const uniforms = mergeDedupe(bloodlines.map(b => b.uniform?.split(','))).map(x => parseInt(x)).filter(x => x && x !== NaN);
const bloodlineNames = bloodlines.map(b => b.name); 
const groups = mergeDedupe(bloodlines.map(b => b.group?.toString().split(','))).map(x => parseInt(x)).filter(x => x && x !== NaN);
if (!a) return {uniforms, names: bloodlineNames, groups};
else return bloodlines;
}
client.db = require('better-sqlite3')('roblox.db');
client.utils = {
    // This is on purpose, it seems most pastebins are NOT stable. I am not gonna make the bot use Pastebin!
    // It used to use hasteb.in until it was accquired by Topal. Red alarms.
    post: async() => 'https://tryitands.ee'
};
client.setStats = async(game=892424128) => {
  const servers = await rbx.getGameInstances(game);
  var MaxPlayers = 0;
  var CurrentlyPlaying = 0;
  servers.Collection?.forEach(async server => {
      CurrentlyPlaying = CurrentlyPlaying + server.CurrentPlayers.length;
      MaxPlayers = MaxPlayers + server.Capacity;
  });
      client.user.setActivity({
          status: 'dnd',
          name: `with ${Humanize.intComma(CurrentlyPlaying) || '..'} ilum players`,
          type: 'STREAMING',
          url: 'https://twitch.tv/pokimane'
      })
    }

(async function () {
    console.log(colors.brightGreen(figlet.textSync('BGC Reborn', {horizontalLayout:'full'})));
    const user = await rbx.setCookie(cookie).catch(() => null) || {};
    console.log(`Logged into ROBLOX as${user.IsPremium ? ' Premium User' : ''} ${user.UserName} (${user.UserID})\nAccount currently has ${user.RobuxBalance} Robux.`)
    console.log('Registering commands & events...');
    await CommandHandler.registerEvents('./events');
    await CommandHandler.registerCommands('./commands'); // changeable if u wish, it has these defaults 
    // and tbh the function doesnt exactly need you to specify it since it can be defined at command handler level.
})();



// Bot Login

client.login(token);