/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { join } = require('path');
const archive = require('../modules/archive');

module.exports = {
	name: 'close',
	description: 'Fermer un ticket; soit un ticket mentionné, Soit le ticket dans lequel la commande est exécutée.',
	usage: '[ticket]',
	aliases: ['none'],
	example: 'close #ticket-17',
	args: false,
	async execute(client, message, _args, log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Ce salon n\'est pas un ticket**')
			.setDescription('Utilisez cette commande dans le ticket que voulez fermer, ou mentionnez le ticket.')
			.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;
		let channel = message.mentions.channels.first();
		// || client.channels.resolve(await Ticket.findOne({ where: { id: args[0] } }).channel) // channels.fetch()

		if (!channel) {
			channel = message.channel;

			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) return message.channel.send(notTicket);
		} else {
			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) {
				notTicket
					.setTitle('❌ **Ce salon n\'est pas un ticket**')
					.setDescription(`${channel} n'est pas un ticket.`);
				return message.channel.send(notTicket);
			}

		}

		let paths = {
			text: join(__dirname, `../../user/transcripts/text/${ticket.get('channel')}.txt`),
			log: join(__dirname, `../../user/transcripts/raw/${ticket.get('channel')}.log`),
			json: join(__dirname, `../../user/transcripts/raw/entities/${ticket.get('channel')}.json`)
		};

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Commande refusée**')
					.setDescription(`Vous n'êtes pas autorisé à modifier ${channel} parce qu'il ne vous appartient pas et que vous n'êtes pas membre du staff.`)
					.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
					.setFooter(guild.name, guild.iconURL())
			);

		
		if (config.commands.close.confirmation) {
			let success;
			let pre = fs.existsSync(paths.text) || fs.existsSync(paths.log)
				? `Vous pourrez voir une version archivée du ticket avec \`${config.prefix}transcript ${ticket.id}\``
				: '';
				
			let confirm = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❔ Êtes-vous sûr?')
					.setDescription(`${pre}\n**Reagissez avec ✅ pour confirmer.**`)
					.setFooter(guild.name + ' | Expire dans 15 secondes', guild.iconURL())
			);

			await confirm.react('✅');

			const collector = confirm.createReactionCollector(
				(r, u) => r.emoji.name === '✅' && u.id === message.author.id, {
					time: 15000
				});

			collector.on('collect', async () => {
				if (channel.id !== message.channel.id) {
					channel.send(
						new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('**Ticket fermé**')
							.setDescription(`Ticket fermé par ${message.author}`)
							.setFooter(guild.name, guild.iconURL())
					);
				}

				confirm.reactions.removeAll();
				confirm.edit(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`✅ **Ticket ${ticket.id} fermé**`)
						.setDescription('Ce salon va automatiquement être supprimé dans quelques secondes, une fois que les messages auront été archivées.')
						.setFooter(guild.name, guild.iconURL())
				);
				

				if (channel.id !== message.channel.id)
					message.delete({
						timeout: 5000
					}).then(() => confirm.delete());
				
				success = true;
				close();
			});


			collector.on('end', () => {
				if (!success) {
					confirm.reactions.removeAll();
					confirm.edit(
						new MessageEmbed()
							.setColor(config.err_colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('❌ **Expiré**')
							.setDescription('Vous avez mis trop longtemps à réagir; confirmation annulée.')
							.setFooter(guild.name, guild.iconURL()));

					message.delete({
						timeout: 10000
					}).then(() => confirm.delete());
				}
			});
		} else {
			close();
		}

		
		async function close () {
			let users = [];

			if (config.transcripts.text.enabled || config.transcripts.web.enabled) {
				let u = await client.users.fetch(ticket.creator);
				if (u) {
					let dm;
					try {
						dm = u.dmChannel || await u.createDM();
					} catch (e) {
						log.warn(`Impossible de créer un DM avec ${u.tag}`);
					}

					let res = {};
					const embed = new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`Ticket ${ticket.id}`)
						.setFooter(guild.name, guild.iconURL());

					if (fs.existsSync(paths.text)) {
						embed.addField('Liste des messages', 'Regardez la pièce jointe');
						res.files = [{
							attachment: paths.text,
							name: `ticket-${ticket.id}-${ticket.get('channel')}.txt`
						}];
					}

					if (fs.existsSync(paths.log) && fs.existsSync(paths.json)) {
						let data = JSON.parse(fs.readFileSync(paths.json));
						for (u in data.entities.users) users.push(u);
						embed.addField('Archive web', await archive.export(Ticket, channel)); // this will also delete these files
					}

					if (embed.fields.length < 1) {
						embed.setDescription(`Aucune donnée de liste des messages existe pour ${ticket.id}`);
					}

					res.embed = embed;

					try {
						if (config.commands.close.send_transcripts) dm.send(res);
						if (config.transcripts.channel.length > 1) client.channels.cache.get(config.transcripts.channel).send(res);
					} catch (e) {
						message.channel.send('❌ Je n\'ai pas pu envoyer la liste des messages');
					}
				}
			}

			// update database
			ticket.update({
				open: false
			}, {
				where: {
					channel: channel.id
				}
			});

			// delete channel
			channel.delete({
				timeout: 5000
			});

			log.info(`${message.author.tag} à fermé un ticket (#ticket-${ticket.id})`);

			if (config.logs.discord.enabled) {
				let embed = new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle(`Ticket ${ticket.id} fermé`)
					.addField('Créateur', `<@${ticket.creator}>`, true)
					.addField('Fermé par', message.author, true)
					.setFooter(guild.name, guild.iconURL())
					.setTimestamp();

				if (users.length > 1)
					embed.addField('Membres', users.map(u => `<@${u}>`).join('\n'));

				client.channels.cache.get(config.logs.discord.channel).send(embed);
			}
		}
	}
};
