const Discord = require('discord.js');

  module.exports = {
    name: "prefix",
    description: "View the prefix for Sentry BGC!",
    examples: [],
    /** 
    * @param {import("discord.js").Message} message Message class
    * @param {Array} args User provided arguments.
    * @param {import("discord.js").Client} client Discord.js client
    */
    async execute(message, args, client) {
        return message.channel.send(new Discord.MessageEmbed()
        .setColor('BLUE')
        .setTitle(`Bot Prefix`)
        .setDescription(`The bot prefix for Sentry BGC is \`${client.config.prefix}\`. It may not be changed unfortunately. You may ask the developer, Romvnly#5369 to add this as a feature in the future though!`)
        .setFooter(`Sentry BGC | Up your bloodline!`)
        .setThumbnail(client.user.displayAvatarURL())
        )
    }
  };