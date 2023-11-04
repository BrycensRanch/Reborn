const Discord = require('discord.js');

  module.exports = {
    name: "invite",
    description: "Invite Sentry BGC or share around the invite!",
    examples: [],
    /** 
    * @param {import("discord.js").Message} message Message class
    * @param {Array} args User provided arguments.
    * @param {import("discord.js").Client} client Discord.js client
    */
    async execute(message, args, client) {
        return message.channel.send(new Discord.MessageEmbed()
        .setDescription(`Oh, so you want to **invite** ME?
        Well, you can. Sentry BGC is public for anyone who wants to use it.
        
        **Bot Invite**: [Click Here](https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=388160)
        **Support Server**: [Click Here for awesome support](https://sentry.best/support)
        `)
        .setColor('RANDOM')
        .setTitle('Da best botum')
        .setFooter('Powered by High Studios | Up your bloodline!'));
    }
  };