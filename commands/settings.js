const Discord = require('discord.js');
const humanizedPreferences = {
  "game":"Main Game"
}
  module.exports = {
    name: "settings",
    aliases: ["config"],
    description: "Change/view your settings for Sentry BGC!",
    examples: [],
    /** 
    * @param {Discord.Message} message Message class
    * @param {Array} args User provided arguments.
    * @param {Discord.Client} client Discord.js client
    */
    async execute(message, args, client) {
      // const userPreferences = client.db()
      switch(args[0].toLowerCase()) {
        case 'set':
          
          break;
        default:
          return message.channel.send(":x: | Not a valid configuration option, back to square one. Rerun this command when you can make up your mind.");
      } 
    }
  };