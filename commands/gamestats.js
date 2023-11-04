
  const Discord = require('discord.js');
  const Humanize = require('humanize-plus');
  const axios = require('axios');
  
  
  module.exports = {
    name: "gamestats",
    aliases:['ilumstats', 'gstats'],
    description: "Show statistics for Ilum or any other regular game!",
    examples: ['gamestats '],
    async execute(message, args, client, flags, parsedArgs) {
      await axios.get(`https://games.roblox.com/v1/games/892424128/servers/Public?sortOrder=Asc&limit=100`, {
        headers: {
            'User-Agent':`${client.user.tag}/1.0.1`
        }
    })
    .then(async function (response) {
      var MaxPlayers = 0;
      var CurrentlyPlaying = 0;
      response.data.data.forEach(async server => {
          CurrentlyPlaying = CurrentlyPlaying + server.playing
          MaxPlayers = MaxPlayers + server.maxPlayers
      })
      var GameThumbnail;
      await axios.get(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=371515567&defaults=true&size=768x432&format=Png&isCircular=false`)
      .then(function (response) {
          GameThumbnail = response.data.data[0].thumbnails[0].imageUrl;
      }).catch(err => {
          console.error(err)
      })
      var upvotes;
      var downvotes;
      var favorites;
      var newBadgesToday = 0
      var description;
      var created;
      var edited;
      var visits;
      await axios.get(`https://games.roblox.com/v1/games/votes?universeIds=371515567`)
      .then(function (response) {
          upvotes = response.data.data[0].upVotes;
          downvotes = response.data.data[0].downVotes;
      }).catch(err => {
          console.error(err)
      })
      await axios.get(`https://games.roblox.com/v1/games/371515567/favorites/count`)
      .then(function (response) {
          favorites = response.data.favoritesCount;
      }).catch(err => {
          console.error(err)
      })
      await axios.get(`https://games.roblox.com/v1/games?universeIds=371515567`)
      .then(function (response) {
          description = response.data.data[0].description;
          created = new Date(response.data.data[0].created).toLocaleDateString("en-US");
          edited = new Date(response.data.data[0].updated).toLocaleDateString("en-US");
          visits = response.data.data[0].visits
          
      }).catch(err => {
          console.error(err)
      })
      const gameInfo = new Discord.MessageEmbed()
      .setTitle(`Game Information`)
      .setFooter("Sentry | Easy User Background Checks | Up your bloodline!")
      .addField('Online Stats', `${Humanize.intComma(CurrentlyPlaying) || '..'} / ${Humanize.intComma(MaxPlayers) || '..'}`)
      .addField('Dev Stats', `Created: ${created || '..'}\nLast Updated: ${edited || '..'}`)
      .addField('Ratings', `**${Humanize.intComma(visits) || '..'}** visits,  **${Humanize.intComma(upvotes) || '..'}** upvotes,  **${Humanize.intComma(downvotes) || '..'}** downvotes, and **${Humanize.intComma(favorites) || '..'}** favorites`)
      .addField('Description', `${description || 'Unknown description...'}`)
      .setImage(`${GameThumbnail || "https://doy2mn9upadnk.cloudfront.net/uploads/default/original/3X/6/a/6a776107459a4391181409a28adeda291520a0b6.png"}`)
      .setTimestamp()
      .setColor(11175147)
       await message.channel.send(gameInfo);
    })
    }
  };