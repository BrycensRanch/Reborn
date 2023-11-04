const { exec } = require("child_process");
  
  
  
  module.exports = {
    name: "restart",
    description: "Restart Sentry BGC",
    examples: ['restart my love for coding'],
    ownerOnly: true,
    /** 
     * @param {import("discord.js").Message} message 
     * @param {import("discord.js").Client} client
    */
    async execute(message, [], client, flags) {
     await message.channel.send("👋 | See ya later.").catch(() => null);
     client.destroy();
     if (flags.pm2) {
      exec(`pm2 reload ${process.env.pm_id}`);
     }
     else {
      process.exit(69);
     }
    }
  };