
const colors = require("colors");
const axios = require('axios');

module.exports = async (client) => {
await client.fetchApplication().then(res => {
    client.botInfo = res;
    if (res.owner.constructor.name == 'Team') {
      client.botAdmins = res.owner.members.map(x => x.user.id);
    }
    else {
      client.botAdmins = [];
      client.botAdmins.push(res.owner.user.id);
    }
    })
    .catch(err => {
      client.botAdmins = [];
      console.error("Couldn't fetch Discord API info about the bot! Oh no!");
      console.error(err);
    });
    console.log(colors.brightRed('The bot has successfully started.\n---\n'
    +`Serving ${client.users.cache.size} users, ${client.botAdmins.length} bot admins, ${client.channels.cache.size} channels, and ${client.guilds.cache.size} guilds with ${client.commands.size} commands!`));
    await client.setStats();
    setInterval(async function(){ await client.setStats(); }, 30000);


}