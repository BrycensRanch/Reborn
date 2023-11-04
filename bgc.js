const Discord = require('discord.js');
const axios = require('axios');
const rbx = require('noblox.js');
const progressBar = require('string-progressbar');
const Humanize = require('humanize-plus');

const stringSimilarity = require('string-similarity');
async function isPlayingIlum(user, userThumbnail) {
  var mugShot;
  await axios.get(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user}&size=48x48&format=Png&isCircular=false`
  ).then(function(response) {
    mugShot = response.data.data[0].imageUrl
    if (userThumbnail == mugShot) return true;
    else {
      console.debug(userThumbnail, mugShot)
      return false;
    }

  }).catch((err) => {
    console.error(err);
  });
}
module.exports = {
    name: "bgc",
    description: "Run background check on an ROBLOX User",
    guildOnly: true,
    group: "BGC",
    examples: [],
    /** 
     * @param {import("discord.js").Message} message 
     * @param {Array} args
     * @param {import("discord.js").Client} client
    */
    async execute(message, args, client) {
      message.channel.startTyping();
      // If no username was provided
      if (!args[0]) {
        await axios.get(`https://api.blox.link/v1/user/${message.author.id}`)
          .then(
            async function(response) {
              await axios.get(
                `https://users.roblox.com/v1/users/${response.data.primaryAccount}`
              ).then(async function(rezz) {
                args = [rezz.data.name];
              }).catch(e => {throw e});
            }
          ).catch(async () => {
            await axios.get(
                `https://verify.eryn.io/api/user/${message.author.id}`)
              .then(
                async function(fallback) {
                  args = [fallback.data.robloxUsername];
                }
              ).catch(async () => {
                args = [message.member.displayName];
                message.channel.stopTyping({
                  force: true
                });
                return message.channel.send(
                  ":warning: | You have no information in the major databases for ROBLOX users. D" +
                  "efaulting to your display name..."
                );
              });
          });
      }
      if (message.mentions.users.first()) {
        if (message.mentions.users.first().bot == true) {
          message.channel.stopTyping();
          return message.channel.send(
            "Hey, the provided user is a bot! Who do you think I am? Trying to waste my tim" +
            "e?!?!"
          );
        }
        await axios.get(
          `https://api.blox.link/v1/user/${message.mentions.users.first().id}`
        ).then(async function(response) {
          await axios.get(
            `https://users.roblox.com/v1/users/${response.data.primaryAccount}`
          ).then(async function(rezz) {
            args = [rezz.data.name];
          });
        }).catch(async () => {
          await axios.get(
            `https://verify.eryn.io/api/user/${message.mentions.users.first().id}`
          ).then(async function(fallback) {
            args = [fallback.data.robloxUsername];
          }).catch(() => {
            message.channel.stopTyping({
              force: true
            });
            args = [message.mentions.members.first().displayName
              .trim()];
            return message.channel.send(
              ":warning: | The provided user has no information in the major databases for RO" +
              "BLOX users. Defaulting their display name..."
            );
          });
        });
      }
      const specifiedUser = args.join(" ").trim();
      const initialMsg = await message.channel.send(
        `:gear: | Please wait while I examine \`${specifiedUser}\`'s profile...`
      );
      var userId = await rbx.getIdFromUsername(specifiedUser).catch(() => null);
      if (!userId) {
        message.channel.stopTyping({
          force: true
        });
        return initialMsg.edit(
          `:x: | The specified user \`${specifiedUser}\` does not exist on ROBLOX!`
        );
      }
      userId = Number(userId);
        if (userId == 4913866) {
          message.channel.stopTyping({
            force: true
          });
          return initialMsg.edit(
            ":x: | This user is blacklisted. Error Code: `DO NOT SEARCH`"
          );
        }
        await rbx.getUsernameFromId(userId).then((username) => {
          rbx.getStatus(userId).then((status) => {
            var userStatus = status;
  
            rbx.getBlurb(userId).then((blurb) => {
              var userBlurb = blurb;
              rbx.getPlayerInfo(userId).then(
                async (info) => {
                  const userAge = info.age;
                  const plrVisits = info.visits;
                  var mugShot;
                  var badges = [];
                  var pastUsernames = [];
                  var friendCount;
                  var followerCount;
                  var primary;
                  var primaryID;
                  if (args.join(" ").trim() !== username)
                    initialMsg.edit(
                      `:gear: | Please wait while I examine \`${username}\`'s profile...`
                    );
                  await axios.get(
                    `https://www.roblox.com/headshot-thumbnail/json?userId=${userId}&width=180&height=180`
                  ).then(function(response) {
                    mugShot = response.data.Url;
                  }).catch((err) => {
                    console.error(err);
                  });
                  await axios.get(
                    `https://friends.roblox.com/v1/users/${userId}/friends/count`
                    ).then(
                    function(response) {
                      friendCount = response.data.count;
                    }
                  ).catch((err) => {
                    console.error(err);
                  });
                  await axios.get(
                    ` https://friends.roblox.com/v1/users/${userId}/followers/count`
                  ).then(function(response) {
                    followerCount = response.data
                      .count;
                  }).catch((err) => {
                    console.error(err);
                  });
                  await axios.get(
                    `https://groups.roblox.com/v1/users/${userId}/groups/primary/role`
                  ).then(function(response) {
                    if (response.data !== null)
                      primary = response.data.group
                      .name;
                    if (response.data !== null)
                      primaryID = response.data.group
                      .id;
                  }).catch((err) => {
                    primary = "`None.`";
                    primaryID = undefined;
                  });
                  var bar = progressBar(6, 1, 10);
                  const WaitingEmbed = new Discord
                    .MessageEmbed().setTitle(
                      `Fetching ${username}'s information...`
                    ).setDescription(
                      `${bar[0]}\n\n:medal: | Fetching user's badges...`
                      ).setFooter(
                      "Sentry | Easy User Background Checks | Up your bloodline!"
                    ).setThumbnail(`${mugShot}`)
                    .setTimestamp().setColor(4303840);
                  initialMsg.edit(WaitingEmbed);
                  var cursor;
                  await axios.get(
                    `https://badges.roblox.com/v1/users/${userId}/badges?limit=100&sortOrder=Asc`
                  ).then(async function(response) {
                    cursor = response.data
                      .nextPageCursor;
                    while (cursor) {
                      await axios.get(
                        `https://badges.roblox.com/v1/users/${userId}/badges?limit=100&cursor=${cursor}&sortOrder=Asc`
                      ).then(async function(
                        response) {
                        cursor = response.data
                          .nextPageCursor;
                        for (const badge of
                            response.data
                            .data) {
                          if (badge.name ==
                            "[ Content Deleted ]" ||
                            badge.name ==
                            "Pikachu <3" ||
                            badge.name ==
                            ":B1:" || badge
                            .name ==
                            "KingBird777" ||
                            badge.name ==
                            "KingBird777" ||
                            badge.name ==
                            "d?u?x" || badge
                            .name ==
                            "ShadowOblivionX" ||
                            badge.name ==
                            "Holyfield" ||
                            badge.name ==
                            "Oh rly?" || badge
                            .length == 1)
                            return;
                          badges.push(badge
                            .name);
                        }
                      }).catch((err) => {
                        console.error(err);
                      });
                    }
                    for (const badge of response
                        .data.data) {
                      if (badge.name ==
                        "[ Content Deleted ]" ||
                        badge.name ==
                        "Pikachu <3" || badge
                        .name == ":B1:" || badge
                        .name == "KingBird777" ||
                        badge.name ==
                        "KingBird777" || badge
                        .name == "d?u?x" || badge
                        .name ==
                        "ShadowOblivionX" || badge
                        .name == "Holyfield" ||
                        badge.name == "Oh rly?" ||
                        badge.length == 1)
                        return;
                      badges.push(badge.name);
                    }
                  }).catch((err) => {
                    console.error(err);
                  });
                  var lastOnline;
                  var isOnline;
                  var OnlinePlace;
                  var OnlinePlaceServerID;
                  var gameUrl;
                  await axios.get(
                    `https://api.roblox.com/users/${userId}/onlinestatus/`, {
                      headers: {
                        "Cookie":`RBXEventTrackerV2=CreateDate=12/1/2020 6:16:26 PM&rbxid=111406676&browserid=69228849952; GuestData=UserID=-1642402398; gig_bootstrap_3_OsvmtBbTg6S_EUbwTPtbbmoihFY5ON6v6hbVrTbuqpBs7SyF_LQaJwtwKJ60sY1p=_gigya_ver4; .RBXIDCHECK=2bc1d714-b67f-4231-9c02-34baa5dc1193; _ga=GA1.2.1359160096.1610047400; RBXSource=rbx_acquisition_time=2/3/2021 6:41:27 AM&rbx_acquisition_referrer=&rbx_medium=Direct&rbx_source=&rbx_campaign=&rbx_adgroup=&rbx_keyword=&rbx_matchtype=&rbx_send_info=1; .ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_87EB4329A26D231EAD69A772BE12A93351FD4911A61A61321792A1EFCFA5047A06483C3100837AC1434AB3492782A78DB2FAD1971A9C4D9709822624FEDCADAC25069597CEB3767C059D75905A1F53CBEAB7AB776526CE60D2EB1A13409735D50FF2580A279C9EB9A859EA119E9F9AB75000938529864AEF73497C9E749105E02BA53367C55C4016413D174AB077B705B808F76BA7D64AC76D6B69A91BF92C3E7038D63119224C042751B7087DB77425F598151EFBBA6BC2006DBE37D9939CFF0222B9FCAA222D37F66B0B94CA56CB9A7A60A15CE7A9EFA73C940FF86200051628C9C82D14E15AA864C141A53B7CD8869138B212353E94693B2B7E2B5009F13DDD54C51E2C8E31DC0A1B9F996F9DB0DA02E17F0085E607772AA07636E6F845780323FF899C5DF9D4DCF843CFDFBFA1FAB748360C; .RBXID=_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI3YTY4OGIzOC0wMGU5LTRmYWQtODhlMC1mOTc4ZmI5YzNhNGEiLCJzdWIiOjY1NTM4MjEwfQ.PNiFGLovDQ1ti6BnNy-e7IHdP8QykZG1gmhluWMBVms; __RequestVerificationToken=OWZ50u1uEKsHfF6n6-MmSEqcJu1fLl_ZT_S_AYv0SWGlW00shByOK_F8ix16tr41U96_dbA2r8-I6z55CFjddAdAAkM1; RBXSessionTracker=sessionid=1ee65b0a-12bb-4c9e-8f79-a6aae4959d9d; rbx-ip2=`
                      }
                    }).then(async function(response) {
                    lastOnline = new Date(response
                        .data.LastOnline)
                      .toLocaleString();
                    isOnline = response.data
                      .LastLocation;
                    gameUrl = response.data
                      .LastLocation.slice(8)
                      .replace(/[^a-zA-Z ]/g, "")
                      .trim().replace(
                        /\s+/g,
                        "-"
                      );
                    OnlinePlace = response.data
                      .PlaceId;
                    OnlinePlaceServerID = response
                      .data.GameId;
  
                    await axios.get(
                      `https://www.roblox.com/games/getgameinstancesjson?placeId=892424128&startIndex=0`, {
                        headers: {
                          "Cookie":`RBXEventTrackerV2=CreateDate=12/1/2020 6:16:26 PM&rbxid=111406676&browserid=69228849952; GuestData=UserID=-1642402398; gig_bootstrap_3_OsvmtBbTg6S_EUbwTPtbbmoihFY5ON6v6hbVrTbuqpBs7SyF_LQaJwtwKJ60sY1p=_gigya_ver4; .RBXIDCHECK=2bc1d714-b67f-4231-9c02-34baa5dc1193; _ga=GA1.2.1359160096.1610047400; RBXSource=rbx_acquisition_time=2/3/2021 6:41:27 AM&rbx_acquisition_referrer=&rbx_medium=Direct&rbx_source=&rbx_campaign=&rbx_adgroup=&rbx_keyword=&rbx_matchtype=&rbx_send_info=1; .ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_87EB4329A26D231EAD69A772BE12A93351FD4911A61A61321792A1EFCFA5047A06483C3100837AC1434AB3492782A78DB2FAD1971A9C4D9709822624FEDCADAC25069597CEB3767C059D75905A1F53CBEAB7AB776526CE60D2EB1A13409735D50FF2580A279C9EB9A859EA119E9F9AB75000938529864AEF73497C9E749105E02BA53367C55C4016413D174AB077B705B808F76BA7D64AC76D6B69A91BF92C3E7038D63119224C042751B7087DB77425F598151EFBBA6BC2006DBE37D9939CFF0222B9FCAA222D37F66B0B94CA56CB9A7A60A15CE7A9EFA73C940FF86200051628C9C82D14E15AA864C141A53B7CD8869138B212353E94693B2B7E2B5009F13DDD54C51E2C8E31DC0A1B9F996F9DB0DA02E17F0085E607772AA07636E6F845780323FF899C5DF9D4DCF843CFDFBFA1FAB748360C; .RBXID=_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI3YTY4OGIzOC0wMGU5LTRmYWQtODhlMC1mOTc4ZmI5YzNhNGEiLCJzdWIiOjY1NTM4MjEwfQ.PNiFGLovDQ1ti6BnNy-e7IHdP8QykZG1gmhluWMBVms; __RequestVerificationToken=OWZ50u1uEKsHfF6n6-MmSEqcJu1fLl_ZT_S_AYv0SWGlW00shByOK_F8ix16tr41U96_dbA2r8-I6z55CFjddAdAAkM1; RBXSessionTracker=sessionid=1ee65b0a-12bb-4c9e-8f79-a6aae4959d9d; rbx-ip2=`
                        }
                      }
                    ).then(async function(
                      response) {
                      var isInIlum;
                      console.log(response
                        .data);
                      response.data.Collection
                        .forEach(async (
                          server) => {
                          for (const
                              RobloxPlayer of
                              server
                              .CurrentPlayers) {
                            isInIlum =
                              await isPlayingIlum(
                                userId,
                                RobloxPlayer
                                .Thumbnail
                                .Url);
                          }
                          if (isInIlum) {
                            await axios
                              .get(
                                `https://games.roblox.com/v1/games?universeIds=371515567`
                                ).then(
                                async function(
                                  gameInfo
                                  ) {
                                  isOnline
                                    =
                                    `Playing ${gameInfo.data.data[0].name.replace(/[()]/g, "")}`;
                                  gameUrl
                                    =
                                    gameInfo
                                    .data
                                    .data[
                                      0]
                                    .name
                                    .replace(
                                      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
                                      ""
                                    )
                                    .replace(
                                      /[^a-zA-Z ]/g,
                                      ""
                                      )
                                    .trim()
                                    .replace(
                                      /\s+/g,
                                      "-"
                                      );
                                  OnlinePlace
                                    =
                                    gameInfo
                                    .data
                                    .data[
                                      0]
                                    .rootPlaceId;
                                  OnlinePlaceServerID
                                    =
                                    server
                                    .id;
                                }
                              ).catch((
                                err) => {
                                return console
                                  .error(
                                    err
                                    );
                              });
                          }
                        });
                    }).catch((err) => {
                      message.channel.send(
                        `WARNING: ${err.message} at ${err.config?.url || this.name}`
                        );
                      return console.error(err);
                    });
                  }).catch((err) => {
                    console.error(err);
                  });
                  var userCursor;
                  await axios.get(
                    `https://users.roblox.com/v1/users/${userId}/username-history?limit=100&sortOrder=Asc`
                  ).then(async function(response) {
                    userCursor = response.data
                      .nextPageCursor;
                    while (userCursor) {
                      await axios.get(
                        `https://users.roblox.com/v1/users/${userId}/username-history?limit=100&cursor=${userCursor}&sortOrder=Asc`
                      ).then(async function(
                        response) {
                        userCursor = response
                          .data
                          .nextPageCursor;
                        for (const
                            usernameObj of
                            response.data
                            .data) {
                          pastUsernames.push(
                            usernameObj.name
                            );
                        }
                      }).catch((err) => {
                        console.error(err);
                      });
                    }
                    for (const usernameObj of
                        response.data.data) {
                      pastUsernames.push(usernameObj
                        .name);
                    }
                  }).catch((err) => {
                    console.error(err);
                    message.channel.send(
                      `WARNING: ${err.message} at ${err.config.url}`
                      );
                  });
                  var HasteLink =
                    "https://i.pinimg.com/originals/34/68/45/346845b3d59466290e0d583958177037.jpg";
                  if (badges[0])
                    HasteLink = await client.utils.post(badges
                      .join(`\n`)).catch((err) => {
                      HasteLink =
                        "https://www.roblox.com/request-error?code=500&403;http://data.roblox.com:80/er" +
                        "ror/";
                      console.error(err);
                      return message.channel.send(
                        `Oh no, the badges couldn't be uploaded for some reason! Contact a admin!`
                      ).then((msg) => msg.delete({
                        timeout: 2500
                      }));
                    });
                  if (userStatus == "") {
                    userStatus = "`None.`";
                  }
  
                  if (userBlurb == "") {
                    userBlurb = "`None.`";
                  }
                  if (!primaryID) {
                    primaryID = 7502617;
                  }
                  const bloodlines = client.getBloodlines();
                  var badgeNumber = badges.length;
                  const basicInfo = new Discord
                    .MessageEmbed().setTitle(
                      `${username} | Basic Information`
                    ).setDescription(
                      `[Profile Link](https://roblox.com/users/${userId}/profile)`
                      ).addField(
                      "User's ROBLOX ID",
                      `${userId}`,
                      true
                    );
                  if (pastUsernames[11]) {
                    const Usernames = await client.utils.post(
                      pastUsernames.join(`\n`));
                    basicInfo.addField(
                      "User's Past Usernames",
                      `[${Humanize.oxford(pastUsernames, 10) || "`None`"}](${Usernames})`,
                      false
                    );
                  }
                  if (!pastUsernames[11]) {
                    basicInfo.addField(
                      "User's Past Usernames",
                      `${Humanize.oxford(pastUsernames, 10) || "`None`"}`,
                      false
                    );
                  }
                  if (isOnline && isOnline !==
                    "Playing" && isOnline.startsWith(
                      "Playing")) {
                    basicInfo.addField(
                      "Last Online",
                      `${lastOnline || "`IDK`"} EST [${isOnline || "`IDK`"}](https://www.roblox.com/games/${OnlinePlace}/${gameUrl}?gameId=${OnlinePlaceServerID})`,
                      false
                    );
                  } else {
                    basicInfo.addField(
                      "Last Online",
                      `${lastOnline || "`IDK`"} EST (${isOnline || "`IDK`"})`,
                      false
                    );
                  }
                  basicInfo.addField(
                    "User's ROBLOX Account Age",
                    `${Humanize.intComma(userAge)} days. \n\`\`\`diff\nRegistered at ${info.joinDate.toLocaleDateString() || "Unknown Date"}\`\`\``,
                    true
                  );
                  basicInfo.addField(
                    "User's Social Stuff",
                    `${friendCount} friends and ${Humanize.compactInteger(followerCount, 1)} followers\n[${Humanize.intComma(badgeNumber)} badges](${HasteLink})\n${plrVisits && !isNaN(plrVisits)
                    ? Humanize.compactInteger(plrVisits, 1)
                    : "Unknown"} game visit(s).`,
                    true
                  );
                  basicInfo.addField(
                    "User's Primary Group",
                    `[${primary}](https://www.roblox.com/groups/${primaryID}/Sentry-Background-Checks)`,
                    true
                  );
                  basicInfo.addField(
                    "User's Current ROBLOX Status",
                    `${userStatus}`, false);
                  basicInfo.addField(
                    "User's Current ROBLOX Blurb",
                    `${userBlurb}`, false);
                  basicInfo.setFooter(
                    "Sentry | Easy User Background Checks | Up your bloodline!"
                  );
                  basicInfo.setThumbnail(`${mugShot}`);
                  basicInfo.setTimestamp();
                  basicInfo.setColor(16741985);
                  bar = progressBar(6, 2, 10);
                  WaitingEmbed.setDescription(
                    `${bar[0]}\n\n:gear: | Acquired basic profile info...`
                  );
                  initialMsg.edit(WaitingEmbed);
  
                  const groupInfo = new Discord
                    .MessageEmbed().setTitle(
                      `${username} | Group Information`
                    ).setDescription(
                      "List of groups the user is in, with ranks."
                      ).setFooter(
                      "Sentry | Easy User Background Checks | Up your bloodline!"
                    ).setThumbnail(`${mugShot}`)
                    .setTimestamp().setColor(4303840);
                  var isInGroup = 0;
                  var theGroup = await rbx.getRankInGroup(
                    5340451, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField(
                      "The Rebel Alliance",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      5340451, Number(theGroup));
                    groupInfo.addField(
                      "The Rebel Alliance",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  var theGroup = await rbx.getRankInGroup(
                    3339710, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField(
                      "The Galactic Republic",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      3339710, Number(theGroup));
                    groupInfo.addField(
                      "The Galactic Republic",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  var theGroup = await rbx.getRankInGroup(
                    4262817, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField(
                      "The Jedi Order | Guardians",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      4262817, Number(theGroup));
                    groupInfo.addField("TJO: Guardians",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  var theGroup = await rbx.getRankInGroup(
                    4262820, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField(
                      "The Jedi Order | Sentinels",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      4262820, Number(theGroup));
                    groupInfo.addField("TJO: Sentinels",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  var theGroup = await rbx.getRankInGroup(
                    4262823, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField(
                      "The Jedi Order | Consulars",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      4262823, Number(theGroup));
                    groupInfo.addField("TJO: Consulars",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  var theGroup = await rbx.getRankInGroup(
                    3709245, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField(
                      "The Jedi Order | Gray Jedi",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      3709245, Number(theGroup));
                    groupInfo.addField("TJO: Gray Jedi",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  var theGroup = await rbx.getRankInGroup(
                    5342339, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField("SWU Bloodlines",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      5342339, Number(theGroup));
                    groupInfo.addField("SWU Bloodlines",
                      `${theRole.name}`);
                    isInGroup++;
                  }
                  var theGroup = await rbx.getRankInGroup(
                    2569359, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField("The Jedi Order",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      2569359, Number(theGroup));
                    groupInfo.addField("The Jedi Order",
                      `${theRole.name}`);
                    isInGroup++;
                  }
                  var theGroup = await rbx.getRankInGroup(
                    3048995, Number(userId));
                  if (theGroup == 0) {
                    groupInfo.addField("The Sith Order",
                      `Guest (Not In Group)`);
                  }
                  if (theGroup > 0) {
                    var theRole = await rbx.getRole(
                      3048995, Number(theGroup));
  
                    groupInfo.addField(
                      "The **EPIC** Sith Order",
                      `${theRole.name}`);
                    isInGroup++;
                  }
  
                  bar = progressBar(6, 3, 10);
                  WaitingEmbed.setDescription(
                    `${bar[0]}\n\n:gear: | Found group ranks...`
                    );
                  initialMsg.edit(WaitingEmbed);
  
                  const gamepassInfo = new Discord
                    .MessageEmbed().setTitle(
                      `${username} | Gamepass Information`
                    ).setFooter(
                      "Sentry | Easy User Background Checks | Up your bloodline!"
                      ).setThumbnail(
                      `${mugShot}`
                    ).setTimestamp().setColor(11175147);
  
                  const gamepassesToCheck = [
                    "2737787",
                    "2737788",
                    "2778577",
                    "2804185",
                    "2994194",
                    "3091680",
                    "3515489",
                    "3515505",
                    "3515508",
                    "3515509",
                    "3515510",
                    "3515511",
                    "3598307"
                  ];
                  const gpName = [];
  
                  for (var i = 0; i < gamepassesToCheck
                    .length; i++) {
                    function addThings(response) {
                      if (response.data.data.length !=
                        0) {
                        gpName.push(
                          `${response.data.data[0].name}`
                          );
                      } else;
                    }
                    await axios.get(
                      `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${Number(gamepassesToCheck[i])}`
                    ).then(function(response) {
                      addThings(response);
                    });
                  }
                  bar = progressBar(6, 4, 10);
                  WaitingEmbed.setDescription(
                    `${bar[0]}\n\n:gear: | Collecting t-shirt info...`
                    );
                  initialMsg.edit(WaitingEmbed);
  
                  gamepassInfo.setDescription(
                    `List of relevant gamepasses the user has.\n\n${gpName.join("\n")}`
                  );
  
                  const tshirtInfo = new Discord
                    .MessageEmbed().setTitle(
                      `${username} | T-Shirt Information`
                    ).setFooter(
                      "Sentry | Easy User Background Checks | Up your bloodline!"
                      ).setThumbnail(
                      `${mugShot}`
                    ).setTimestamp().setColor(5369252);
                  const shirtsToCheck = bloodlines
                    .uniforms;
                  const shirtNames = [];
  
                  for (var i = 0; i < shirtsToCheck
                    .length; i++) {
                    function addThings2(response) {
                      if (response.data.data[0].name ==
                        "Discontinued-") {
                        response.data.data[0].name =
                          "Old Morningstar Uniform";
                      }
                      if (response.data.data[0].id ==
                        4823664515) {
                        response.data.data[0].name =
                          "Old Graceful Uniforms (+)";
                      }
                      shirtNames.push(
                        `${response.data.data[0].name}`);
                    }
                    await axios.get(
                      `https://inventory.roblox.com/v1/users/${userId}/items/Asset/${shirtsToCheck[i]}`
                    ).then(async function(response) {
                      addThings2(response);
                    }).catch((err) => {
                      return;
                    });
                  }
                  tshirtInfo.setDescription(
                    `List of relevant t-shirts the user has.\n\n${shirtNames.join("\n")}`
                  );
  
                  var badgeNumber = 0;
  
                  bar = progressBar(6, 5, 10);
                  WaitingEmbed.setDescription(
                    `${bar[0]}\n\n:clock2: | Finishing up..`
                    );
                  initialMsg.edit(WaitingEmbed);
  
                  await message.channel.send(basicInfo);
                  if (isInGroup > 0)
                    await message.channel.send(groupInfo);
                  if (gpName.length > 0)
                    await message.channel.send(
                      gamepassInfo);
                  if (shirtNames.length > 0)
                    message.channel.send(tshirtInfo);
                  var bloodlineMemberFriends = [];
                  const alts = [];
                  await axios.get(
                    `https://friends.roblox.com/v1/users/${userId}/friends`
                    ).then(
                    async function(response) {
                      response.data.data.forEach(
                      async (friend) => {
                            for (const bloodline of bloodlines.names) {
                              if (friend.name.includes(bloodline)) bloodlineMemberFriends.push(friend.name);
                            }
                        });
                      if (response.data.data[0]) {
                        var matches = stringSimilarity
                          .findBestMatch(
                            `${username}`,
                            response.data.data.map((
                              x) => x.name)
                          );
                        if (matches.bestMatch.rating <
                          0.7)
                          return;
                        const goodMatches = [];
                        matches.ratings.forEach(
                        async (match) => {
                            if (match.rating <
                              0.7) {
                              await rbx
                                .getIdFromUsername(
                                  `${match.target}`
                                  ).then(async (
                                  id) => {
                                  await axios
                                    .get(
                                      `https://friends.roblox.com/v1/users/${id}/followers/count`
                                      ).then(
                                      function(
                                        response
                                        ) {
                                        if (
                                          response
                                          .data
                                          .count <
                                          15
                                          ) {
                                          if (
                                            !
                                            alts
                                            .includes(
                                              match
                                              .target
                                              )
                                            )
                                            alts
                                            .push(
                                              match
                                              .target
                                              );
                                        }
                                      }
                                    ).catch((
                                        err
                                        ) => {
                                        console
                                          .error(
                                            err
                                            );
                                      });
                                  await rbx
                                    .getPlayerInfo(
                                      `${Number(id)}`
                                      ).then(
                                      async (
                                        info
                                        ) => {
                                        if (
                                          info
                                          .age <
                                          30
                                          ) {
                                          if (
                                            !
                                            alts
                                            .includes(
                                              match
                                              .target
                                              )
                                            )
                                            alts
                                            .push(
                                              match
                                              .target
                                              );
                                        }
                                      })
                                    .catch((
                                        err
                                        ) => {
                                        return;
                                      });
                                });
                            }
                            if (!alts.includes(
                                match.target))
                              alts.push(match
                                .target);
                          });
                      }
                      if (!response.data.data[0]) {
                        await axios.get(
                          `https://friends.roblox.com/v1/users/${userId}/followers/count`
                        ).then(async function(
                          response) {
                          if (response.data
                            .count < 26 &&
                            response.data
                            .count !== 0) {
                            await axios.get(
                              `https://friends.roblox.com/v1/users/${userId}/followers?sortOrder=Asc&limit=25`
                            ).then(
                            async function(
                                response) {
                                var
                                  matches2 =
                                  stringSimilarity
                                  .findBestMatch(
                                    `${username}`,
                                    response
                                    .data
                                    .data
                                    .map((
                                      x) =>
                                      x.name
                                      )
                                  );
                                if (matches2
                                  .bestMatch
                                  .rating <
                                  0.7)
                                  return;
                                matches
                                  .ratings
                                  .forEach(
                                    async (
                                      match
                                      ) => {
                                      if (
                                        !
                                        alts
                                        .includes(
                                          match
                                          .target
                                          )
                                        )
                                        alts
                                        .push(
                                          match
                                          .target
                                          );
                                    }
                                  );
                              }).catch((
                              err) => {
                                console.error(
                                  err);
                              });
                          }
                        }).catch((err) => {
                          console.error(err);
                        });
                      }
                      const altInfo = new Discord
                        .MessageEmbed().setTitle(
                          `${username} | Alt Information`
                        ).setFooter(
                          "Sentry | Easy User Background Checks | Up your bloodline!"
                          ).setThumbnail(
                          `https://i.pinimg.com/originals/33/de/97/33de974459778d84e4831821cd34914c.png`
                        ).setTimestamp().setColor(
                          `#ff9d00`).setDescription(
                          `List of relevant the users assiocated with ${username}.\n\n${alts.join("\n")}`
                        );
                      if (alts.length > 0)
                        message.channel.send(altInfo);
                    }
                  ).catch((err) => {
                    console.error(err);
                  });
                  message.channel.stopTyping({
                    force: true
                  });
                  if (bloodlineMemberFriends.length > 0)
                    message.channel.send(
                      `Also, this user is associated with the possible bloodline members:\n\`\`\`${Humanize.oxford([...new Set(bloodlineMemberFriends)])}\`\`\``
                    );
                  bar = progressBar(6, 6, 10);
                  initialMsg.edit("Information fetched!");
                  WaitingEmbed.setTitle(
                    `${username}'s information has been fetched!`
                    );
                  WaitingEmbed.setDescription(
                    `${bar[0]}\n\n:100: | Finished!`);
                  initialMsg.edit(WaitingEmbed);
                  setTimeout(function() {
                    initialMsg.delete().catch((
                    err) => {
                      return;
                    });
                  }, 5000);
                }).catch((err) => {

                console.error(err);
                message.channel.stopTyping({
                  force: true
                });
                return initialMsg.edit(
                  ":x: | This error should never occur. Contact `Romvnly#5369` immediately. Error" +
                  " Code: `1`"
                );
              });
            }).catch((err) => {
              message.channel.stopTyping({
                force: true
              });
              return initialMsg.edit(
                ":x: | The user provided is __**BANNED**__ from ROBLOX. Error Code: `2`"
              );
            });
          }).catch((err) => {
            console.error(err);
            message.channel.stopTyping({
              force: true
            });
            return initialMsg.edit(
              ":x: | This error should never occur. Contact `Romvnly#5369` immediately. Error" +
              " Code: `3` "
            );
          });
        }).catch((err) => {
          console.error(err);
          message.channel.stopTyping({
            force: true
          });
          return initialMsg.edit(
            ":x: | This error should never occur. Contact `Romvnly#5369` immediately. Error" +
            " Code: `4` "
          );
      }).catch(() => {
        // If the user is non existentr
        message.channel.stopTyping({
          force: true
        });
        return initialMsg.edit(
          ":x: | The user, `" + args.join(" ") +
          "`, does not exist on ROBLOX."
        );
      });
    }
  };