/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const {
	MessageEmbed
} = require('discord.js');
const fs = require('fs');
const { join } = require('path');

module.exports = {
	name: 'delete',
	description: 'Supprime un ticket. Similaire au fait de fermer un ticket, mais sans sauvegarder de liste des messages.',
	usage: '[ticket]',
	aliases: ['del'],
	example: 'delete #ticket-17',
	args: false,
	async execute(client, message, _args, log, {
		config,
		Ticket
	}) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Ce salon n\'est pas un ticket**')
			.setDescription('Utilisez cette commande dans le ticket que voulez supprier, ou mentionnez le ticket.')
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
			if (!ticket) return channel.send(notTicket);

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
		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role))
			return channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Commande refusée**')
					.setDescription(`Vous n'êtes pas autorisé à modifier ${channel} parce qu'il ne vous appartient pas et que vous n'êtes pas membre du staff.`)
					.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
					.setFooter(guild.name, guild.iconURL())
			);

		
		if (config.commands.delete.confirmation) {
			let success;
			let confirm = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❔ Êtes-vous-sûr ?')
					.setDescription(
						`:warning: Cette action est **définitive**, le ticket va complètement être enlevé de la base de données.
						Vous ne pourrez **pas** voir la liste des messages plus tard.
						Utilisez la commande \`close\` si vous voulez voir la liste des messages.\n**Réagissez avec ✅ pour confirmer.**`)
					.setFooter(guild.name + ' | Expire dans 15 secondes', guild.iconURL())
			);

			await confirm.react('✅');

			const collector = confirm.createReactionCollector(
				(r, u) => r.emoji.name === '✅' && u.id === message.author.id, {
					time: 15000
				});

			collector.on('collect', async () => {
				if (channel.id !== message.channel.id)
					channel.send(
						new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('**Ticket supprimé**')
							.setDescription(`Ticket supprimé par ${message.author}`)
							.setFooter(guild.name, guild.iconURL())
					);

				confirm.reactions.removeAll();
				confirm.edit(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`✅ **Ticket ${ticket.id} supprimé**`)
						.setDescription('Le ticket va automatiquement être supprimé dans quelques secondes.')
						.setFooter(guild.name, guild.iconURL())
				);

				if (channel.id !== message.channel.id)
					message.delete({
						timeout: 5000
					}).then(() => confirm.delete());

				success = true;
				del();
			});

			collector.on('end', () => {
				if (!success) {
					confirm.reactions.removeAll();
					confirm.edit(
						new MessageEmbed()
							.setColor(config.err_colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('❌ **Expiré**')
							.setDescription('Vous avez mis trop longtemps à réagir, confirmation annulée.')
							.setFooter(guild.name, guild.iconURL()));

					message.delete({
						timeout: 10000
					}).then(() => confirm.delete());
				}
			});
		} else {
			del();
		}


		async function del () {
			let txt = join(__dirname, `../../user/transcripts/text/${ticket.get('channel')}.txt`),
				raw = join(__dirname, `../../user/transcripts/raw/${ticket.get('channel')}.log`),
				json = join(__dirname, `../../user/transcripts/raw/entities/${ticket.get('channel')}.json`);

			if (fs.existsSync(txt)) fs.unlinkSync(txt);
			if (fs.existsSync(raw)) fs.unlinkSync(raw);
			if (fs.existsSync(json)) fs.unlinkSync(json);

			// update database
			ticket.destroy(); // remove ticket from database

			// channel
			channel.delete({
				timeout: 5000
			});


			log.info(`${message.author.tag} a supprimé un ticket (#ticket-${ticket.id})`);

			if (config.logs.discord.enabled) {
				client.channels.cache.get(config.logs.discord.channel).send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle('Ticket supprimé')
						.addField('Créateur', `<@${ticket.creator}>`, true)
						.addField('Supprimé par', message.author, true)
						.setFooter(guild.name, guild.iconURL())
						.setTimestamp()
				);
			}
		}
		
	}
};