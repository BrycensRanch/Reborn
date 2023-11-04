const Discord = require('discord.js');
const axios = require('axios');
const rbx = require('noblox.js');
const progressBar = require('string-progressbar');
const Humanize = require('humanize-plus');

module.exports = {
    name: "bgc",
    aliases: ["devbgc"],
    description: "Run background check on an ROBLOX User",
    guildOnly: true,
    group: "BGC",
    examples: [],
    /**
     * @param {Discord.Message} message Message class
     * @param {Array} args User provided arguments
     * @param {Discord.Client} client discord.js client
     * @param {Object} flags User provided flags.
     */
    async execute(message, args, client, flags) {
        const games = client.db.prepare("SELECT name, short FROM Games")
            .all(); // Request partial data from the database 
        var orginialGame = flags.game;
        const longNames = games.map(g => g.name);
        const shortNames = games.map(g => g.short);
        const gameAliases = longNames.concat(shortNames);
        flags.game = gameAliases.includes(orginialGame) ? orginialGame : `Ilum v1`;
        if (!client.db.prepare('SELECT * FROM Preferences WHERE id = ?')
            .get(message.author.id) && !orginialGame) {
            const prompt = await message.channel.send(`What game would you like this search to be peformed on?\n\nGames:\n\`${games.map(g => `${g.name} (${g.short})`).join("\n")}\`\n\nYou have \`30 seconds\` to answer this or it'll default to \`${flags.game}\`. Say \`cancel\` to cancel this command.`);
            const filter = m => m.content?.length > 0 && m.author.id === message.author.id;
            const collected = await message.channel.awaitMessages(filter, {
                max: 1,
                time: 30000,
            })
                .catch(() => null);
            if (!collected || !collected.first()) {
                flags.game = "Ilum v1";
                prompt.delete()
                    .catch(() => null);
            }
            if (collected && collected.first()) {
                collected.first()
                    .delete()
                    .catch(() => null);
                prompt.delete()
                    .catch(() => null);
                if (collected.first()
                    .content.toLowerCase()
                    .includes("cancel") || collected.first()
                    .content.toLowerCase()
                    .includes("exit")) return message.delete()
                    .catch(() => null);
                flags.game = collected.first()
                    .toString();
                if (!client.db.prepare("SELECT name FROM Games WHERE name LIKE $game OR short LIKE $game")
                    .get({
                        game: flags.game
                    })) return message.channel.send("Rerun this command when you can make up your damn mind on what game you'd like to search on. Goodbye.")
                    .then(msg => msg.delete({
                        timeout: 2500
                    }));
                const prompt2 = await message.channel.send("Would you like to save this as your preference for further searches? You can change your preference later on with the \`settings\` command.\nSay \`cancel\` to cancel this action and proceed.");
                const filter2 = m => m.content?.length > 0 && m.author.id === message.author.id;
                const pref = await message.channel.awaitMessages(filter2, {
                    max: 1,
                    time: 30000,
                })
                    .catch(() => null);
                if (!pref || !pref.first()) prompt2.delete()
                    .catch(() => null);
                if (pref && pref.first()) {
                    if (pref.first()
                        .content.toLowerCase()
                        .includes("cancel") || pref.first()
                        .content.toLowerCase()
                        .includes("exit")) {
                        prompt2.delete()
                            .catch(() => null);
                        pref.first()
                            .delete()
                            .catch(() => null);
                    } else if (pref.first()
                        .content.toLowerCase()
                        .includes("yes") || pref.first()
                        .content.toLowerCase()
                        .includes("yea")) {
                        client.db.prepare('INSERT INTO Preferences (id, game) VALUES(?, ?)')
                            .run(message.author.id, flags.game);
                    } else message.channel.send("I'm gonna take that as a no then, continuing search with game however won't your game choice won't save.")
                        .then(msg => msg.delete({
                            timeout: 2500
                        }))

                }
            } else flags.game = client.db.prepare('SELECT game FROM Preferences WHERE id = ?')
                .get(message.author.id);
        }
        message.channel.startTyping();
        const start = process.hrtime();
        // If no username was provided
        if (!args[0]) {
            await axios.get(`https://api.blox.link/v1/user/${message.author.id}`)
                .then(
                    async function(response) {
                        await axios.get(
                            `https://users.roblox.com/v1/users/${response.data.primaryAccount}`
                        )
                            .then(async function(rezz) {
                                args = [rezz.data.name];
                            })
                            .catch(e => {
                                throw e
                            });
                    }
                )
                .catch(async () => {
                    await axios.get(
                        `https://verify.eryn.io/api/user/${message.author.id}`)
                        .then(
                            async function(fallback) {
                                args = [fallback.data.robloxUsername];
                            }
                        )
                        .catch(async () => {
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
            if (message.mentions.users.first()
                .bot == true) {
                message.channel.stopTyping();
                return message.channel.send(
                    "Hey, the provided user is a bot! Who do you think I am? Trying to waste my tim" +
                    "e?!?!"
                );
            }
            await axios.get(
                `https://api.blox.link/v1/user/${message.mentions.users.first().id}`
            )
                .then(async function(response) {
                    await axios.get(
                        `https://users.roblox.com/v1/users/${response.data.primaryAccount}`
                    )
                        .then(async function(rezz) {
                            args = [rezz.data.name];
                        });
                })
                .catch(async () => {
                    await axios.get(
                        `https://verify.eryn.io/api/user/${message.mentions.users.first().id}`
                    )
                        .then(async function(fallback) {
                            args = [fallback.data.robloxUsername];
                        })
                        .catch(() => {
                            message.channel.stopTyping({
                                force: true
                            });
                            args = [message.mentions.members.first()
                                .displayName
                                .trim()
                            ];
                            return message.channel.send(
                                ":warning: | The provided user has no information in the major databases for RO" +
                                "BLOX users. Defaulting their display name..."
                            );
                        });
                });
        }
        const specifiedUser = args.filter(function(e) {
            return typeof e !== "object"
        })
            .join(" ")
            .trim();
        const initialMsg = await message.channel.send(
            `:gear: | Please wait while I examine \`${specifiedUser}\`'s profile...`
        );
        var userId = await rbx.getIdFromUsername(specifiedUser)
            .catch(() => null);
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
        const plr = await rbx.getPlayerInfo(userId);
        var basicPlr = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        basicPlr = basicPlr.data;
        plr.displayName = basicPlr.displayName;
        plr.isBanned = basicPlr.isBanned;
        plr.id = basicPlr.id;
        if (plr.isBanned) {
            message.channel.stopTyping({
                force: true
            });
            return initialMsg.edit(
                ":x: | The user provided is __**BANNED**__ from ROBLOX. Error Code: `2`"
            );
        }
        if (specifiedUser !== plr.username)
            initialMsg.edit(
                `:gear: | Please wait while I examine \`${plr.username}\`'s profile...`
            );
        const mugShot = await rbx.getPlayerThumbnail(plr.id, 180, "png", false);
        const game = client.db.prepare("SELECT * FROM Games WHERE name LIKE $game OR short LIKE $game")
            .get({
                game: flags.game
            });
        if (!game) throw new ReferenceError('No game was specified for the search');

        plr.mugShot = mugShot[0].imageUrl;
        plr.badges = [];
        plr.customs = [];
        plr.friends = [];
        plr.groups = await rbx.getGroups(plr.id)
            .catch(e => new Error(e));
        plr.primary = plr.groups.find(g => g.IsPrimary);
        var bar = progressBar.splitBar(6, 1, 10);
        const WaitingEmbed = new Discord
            .MessageEmbed()
            .setTitle(
                `Fetching ${plr.username}'s information...`
            )
            .setDescription(
                `${bar[0]}\n\n:medal: | Fetching user's badges...`
            )
            .setFooter(
                "Sentry | Easy User Background Checks | Up your bloodline!"
            )
            .setThumbnail(`${plr.mugShot}`)
            .setTimestamp()
            .setColor(4303840);
        initialMsg.edit(WaitingEmbed);
        var cursor;
        await axios.get(
            `https://badges.roblox.com/v1/users/${plr.id}/badges?limit=100&sortOrder=Asc`
        )
            .then(async function(response) {
                cursor = response.data
                    .nextPageCursor;
                for (const badge of
                    response.data
                        .data) {
                    plr.badges.push(badge.name);
                }
                while (cursor) {
                    await axios.get(
                        `https://badges.roblox.com/v1/users/${plr.id}/badges?limit=100&cursor=${cursor}&sortOrder=Asc`
                    )
                        .then(async function(
                            response) {
                            cursor = response.data
                                .nextPageCursor;
                            for (const badge of
                                response.data
                                    .data) {
                                plr.badges.push(badge.name);
                            }
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                }
                for (const badge of response
                    .data.data) {
                    plr.badges.push(badge.name);
                }
            })
            .catch((err) => {
                console.error(err);
            });
        var presenceData = await rbx.getPresences([plr.id])
            .catch(console.error);
        if (presenceData) {
            presenceData = presenceData.userPresences[0];
            plr.lastOnline = new Date(presenceData.lastOnline)
                .toLocaleString();
            plr.isOnline = presenceData
                .lastLocation;
            plr.gameUrl = presenceData
                .lastLocation.slice(8)
                .replace(/[^a-zA-Z ]/g, "")
                .trim()
                .replace(
                    /\s+/g,
                    "-"
                );
            plr.OnlinePlace = presenceData
                .placeId;
            plr.OnlinePlaceServerID = presenceData.gameId;
        }
        const bloodlines = client.getBloodlines();
        const basicInfo = new Discord
            .MessageEmbed()
            .setTitle(
                `${plr.displayName} | Basic Information`
            )
            .setDescription(
                `**@${plr.username}** (RBX Username)\n[Profile Link](https://roblox.com/users/${plr.id}/profile)`
            )
            .addField(
                "Account ID",
                `${plr.id}`,
                true
            );
        var bloodlineMemberFriends = [];
        if (!!game.bloodlines) {
            plr.friends = (await rbx.getFriends(plr.id))
                .data
            for (const friend of plr.friends) {
                for (const bloodline of bloodlines.names) {
                    if (friend.name.includes(bloodline)) bloodlineMemberFriends.push(friend.name);
                }
            }
        }
        const FriendInfo = new Discord.MessageEmbed()
            .setTitle(`${plr.displayName} | Bloodline Associates`)
            .setColor('PURPLE')
            .setDescription(`This user is associated with the possible bloodline members:\n\`\`\`${Humanize.oxford([...new Set(bloodlineMemberFriends)])}\`\`\``)
            .setThumbnail(plr.mugShot)
            .setTimestamp()
            .setFooter(
                "Sentry | Easy User Background Checks | Up your bloodline!"
            );
        if (plr.oldNames[11]) {
            const Usernames = await client.utils.post(
                plr.oldNames.join(`\n`));
            basicInfo.addField(
                "Past Usernames",
                `[${Humanize.oxford(plr.oldNames, 10) || "`None`"}](${Usernames})`,
                false
            );
        }
        if (!plr.oldNames[11]) {
            basicInfo.addField(
                "Past Usernames",
                `${Humanize.oxford(plr.oldNames, 10) || "`None`"}`,
                false
            );
        }
        if (plr.isOnline && plr.isOnline !==
            "Playing" && plr.isOnline.startsWith(
                "Playing")) {
            basicInfo.addField(
                "Last Online",
                `${plr.lastOnline || "`IDK`"} EST [${plr.isOnline || "`IDK`"}](https://www.roblox.com/games/${plr.OnlinePlace}/${plr.gameUrl}?gameId=${plr.OnlinePlaceServerID})`,
                false
            );
        } else {
            basicInfo.addField(
                "Last Online",
                `${plr.lastOnline || "`IDK`"} EST (${plr.isOnline || "`IDK`"})`,
                false
            );
        }
        basicInfo.addField(
            "Account Age",
            `${Humanize.intComma(plr.age)} days. \n\`\`\`diff\nRegistered at ${plr.joinDate.toLocaleDateString() || "Unknown Date"}\`\`\``,
            true
        );
        var HasteLink;
        basicInfo.addField(
            "Social",
            `${plr.friendCount} friends and ${Humanize.compactInteger(plr.followerCount, 1)} followers\n[${Humanize.intComma(plr.badges.length)} badges](${HasteLink})`,
            true
        );
        basicInfo.addField(
            "Primary Group",
            `[${plr.primary?.Name
                .trim()
            || `\`None.\``}](https://www.roblox.com/groups/${plr.primary?.Id || 7502617}/Sentry-Background-Checks)`,
            true
        );
        basicInfo.addField(
            "Status",
            `${plr.status || `\`None.\``}`, false);
        basicInfo.addField(
            "Blurb",
            `${plr.blurb || `\`None.\``}`, false);
        basicInfo.setFooter(
            "Sentry | Easy User Background Checks | Up your bloodline!"
        );
        basicInfo.setThumbnail(`${plr.mugShot}`);
        basicInfo.setTimestamp();
        basicInfo.setColor(16741985);
        bar = progressBar.splitBar(6, 2, 10);
        WaitingEmbed.setDescription(
            `${bar[0]}\n\n:gear: | Acquiring basic profile info...`
        );
        initialMsg.edit(WaitingEmbed);
        const groupInfo = new Discord
            .MessageEmbed()
            .setTitle(
                `${plr.displayName} | Group Information`
            )
            .setDescription(
                "List of **cool** groups the user is in, with ranks."
            )
            .setFooter(
                "Sentry | Easy User Background Checks | Up your bloodline!"
            )
            .setThumbnail(`${plr.mugShot}`)
            .setTimestamp()
            .setColor(4303840);
        const mergeDedupe = (arr = []) => {
            return [...new Set([].concat(...arr))];
        }
        const groupsToCheck = mergeDedupe(game.groups?.split(','))
            .map(x => parseInt(x))
            .filter(x => x && x !== NaN);
        var ranks = 0;
        for (const group of groupsToCheck) {
            var g = plr.groups.find(x => x.Id == group);
            if (!g) {
                g = await rbx.getGroup(group);
                groupInfo.addField(g.name
                        .replace(/\s+/g, ' ')
                        .trim(),
                    `Guest (Not In Group)`);
            } else {
                ranks++;
                groupInfo.addField(
                    g.Name.replace(/\s+/g, ' ')
                        .trim(), g.Role.trim());
            }
        }
        bar = progressBar.splitBar(6, 3, 10);
        WaitingEmbed.setDescription(
            `${bar[0]}\n\n:gear: | Found group ranks...`
        );
        initialMsg.edit(WaitingEmbed);

        const gamepassInfo = new Discord
            .MessageEmbed()
            .setTitle(
                `${plr.displayName} | Gamepass Information`
            )
            .setFooter(
                "Sentry | Easy User Background Checks | Up your bloodline!"
            )
            .setThumbnail(
                `${plr.mugShot}`
            )
            .setTimestamp()
            .setColor(11175147);
        plr.gamepasses = [];
        plr.uniforms = [];
        const gamepassesToCheck = mergeDedupe(game.gamepasses?.split(','))
            .map(x => parseInt(x))
            .filter(x => x && x !== NaN);

        for (var i = 0; i < gamepassesToCheck
            .length; i++) {
            function addThings(response) {
                if (response.data.data.length !=
                    0) {
                    plr.gamepasses.push(response.data.data[0]);
                } else;
            }
            await axios.get(
                `https://inventory.roblox.com/v1/users/${plr.id}/items/GamePass/${Number(gamepassesToCheck[i])}`
            )
                .then(function(response) {
                    addThings(response);
                });
        }
        bar = progressBar.splitBar(6, 4, 10);
        WaitingEmbed.setDescription(
            `${bar[0]}\n\n:gear: | Collecting t-shirt info...`
        );
        initialMsg.edit(WaitingEmbed);

        gamepassInfo.setDescription(
            `List of relevant gamepasses the user has.\n\n${plr.gamepasses.map(g => g.name).join("\n")}`
        );

        const tshirtInfo = new Discord // if bloodlines. turns numbers
            .MessageEmbed()
            .setTitle(
                `${plr.displayName} | Bloodline Uniforms`
            )
            .setFooter(
                "Sentry | Easy User Background Checks | Up your bloodline!"
            )
            .setThumbnail(
                `${plr.mugShot}`
            )
            .setTimestamp()
            .setColor(5369252);
        const shirtsToCheck = bloodlines
            .uniforms;
        if (!!game.bloodlines) {
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
                    plr.uniforms.push(response.data.data[0]);
                }
                await axios.get(
                    `https://inventory.roblox.com/v1/users/${plr.id}/items/Asset/${shirtsToCheck[i]}`
                )
                    .then(async function(response) {
                        addThings2(response);
                    })
                    .catch((err) => {
                        return;
                    });
            }
            tshirtInfo.setDescription(
                `List of relevant shirts the user has.\n\n${flags.debug ? plr.uniforms.map(g => `[${g.name.replace(/[()]/g, "")}](https://www.roblox.com/catalog/${g.id}/)`).join("\n"): plr.uniforms.map(g => g.name).join("\n")}`
            );
        }
        const customsToCheck = mergeDedupe(game.customs?.split(','))
            .map(x => parseInt(x))
            .filter(x => x && x !== NaN);
        if (game.customs) {
            for (var i = 0; i < customsToCheck
                .length; i++) {
                function addThings(response) {
                    if (response.data.data.length !=
                        0) {
                        plr.customs.push(response.data.data[0]);
                    } else;
                }
                await axios.get(
                    `https://inventory.roblox.com/v1/users/${plr.id}/items/GamePass/${Number(customsToCheck[i])}`
                )
                    .then(function(response) {
                        addThings(response);
                    });
            }
            var customInfo = new Discord
                .MessageEmbed()
                .setTitle(
                    `${plr.displayName} | Customs`
                )
                .setDescription(
                    `List of **amazing** customs that the user has.\n\n${flags.debug ? plr.customs.map(c => `[${c.name.replace(/[()]/g, "")}](https://www.roblox.com/game-pass/${c.id}/)`).join("\n"): plr.customs.map(c => c.name).join("\n")}`
                )
                .setFooter(
                    "Sentry | Easy User Background Checks | Up your bloodline!"
                )
                .setThumbnail(`${plr.mugShot}`)
                .setTimestamp()
                .setColor('#ff9d00');
        }
        bar = progressBar.splitBar(6, 5, 10);
        WaitingEmbed.setDescription(
            `${bar[0]}\n\n:clock2: | Finishing up..`
        );
        const difference = process.hrtime(start);
        initialMsg.edit(WaitingEmbed);
        if (flags.debug && client.botAdmins.includes(message.author.id)) {
            message.channel.send(new Discord.MessageEmbed()
                .setTitle('Debug Information')
                .setDescription(`Here is all the information for the search.
\`\`\`js
BGC completed in ${difference[0] > 0 ? `${difference[0]}s ` : ""}
\`\`\`
Gamepasses -> ${plr.gamepasses.length}/${gamepassesToCheck.length}
Bloodline Uniforms -> ${plr.uniforms.length}/${shirtsToCheck.length}
Groups -> ${plr.groups.length}
Mugshot -> ${plr.mugShot}
Player ID -> ${plr.id}
Game -> ${game.name}
            `)
            );
        }
        message.channel.stopTyping(true);
        initialMsg.delete()
            .catch(() => null);
        let pages = [];
        pages.push({
            emoji: '🔗',
            content: basicInfo
        });
        if (game.customs && plr.customs[0]) pages.push({
            emoji: '💲',
            content: customInfo
        });
        if (ranks) pages.push({
            emoji: '👾',
            content: groupInfo
        });
        if (plr.gamepasses.length) pages.push({
            emoji: '🎮',
            content: gamepassInfo
        });
        if (!!game.bloodlines && plr.uniforms.length) pages.push({
            emoji: '🛡',
            content: tshirtInfo
        });
        if (!!game.bloodlines && bloodlineMemberFriends.length) pages.push({
            emoji: '🤝',
            content: FriendInfo
        })
        let page = 1
        const content = pages[page - 1]?.content || pages[page - 1]
        content.footer.text = pages[1] ? `Page ${page} of ${pages.length} | Up your bloodline!` : content.footer.text;
        const msg = await message.channel.send(content);
        if (pages[1] && message.channel.permissionsFor(message.guild.me)
            .serialize()
            .ADD_REACTIONS) {
            await msg.react("◀️") // error the command out if it doesnt have add reaction permissions, I should fix that.
            await msg.react("▶️")
            //Filters - These  make sure the variables are correct before running a part of code
            const backwardsFilter = (reaction, user) => reaction.emoji.name === "◀️" && user.id === message.author.id
            const forwardsFilter = (reaction, user) => reaction.emoji.name === "▶️" && user.id === message.author.id

            const backwards = msg.createReactionCollector(backwardsFilter, {
                time: 60000
            });
            const forwards = msg.createReactionCollector(forwardsFilter, {
                time: 60000
            });

            backwards.on("collect", (reaction, user) => {
                page--;
                if (page < 1) page = pages.length;
                backwards.resetTimer({
                    time: forwards.options.time,
                    idle: 30000
                })
                const embed = pages[page - 1]?.content || pages[page - 1];
                embed.footer.text = `Page ${page} of ${pages.length} | Up your bloodline!`;
                reaction.users.remove(user.id)
                    .catch(() => null);
                msg.edit(embed)
            })
            forwards.on("collect", (reaction, user) => {
                page++;
                if (page === pages.length + 1) page = 1;
                forwards.resetTimer({
                    time: forwards.options.time,
                    idle: 30000
                });
                const embed = pages[page - 1]?.content || pages[page - 1];
                embed.footer.text = `Page ${page} of ${pages.length} | Up your bloodline!`;
                reaction.users.remove(user.id)
                    .catch(() => null);
                msg.edit(embed)
            })
            backwards.on("end", () => {
                message.reactions.removeAll()
                    .catch(() => null);
            })
            forwards.on("end", () => {
                message.reactions.removeAll()
                    .catch(() => null);
            })
        }
    }
};