/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const fs = require('fs');
const { join } = require('path');

const {
	MessageEmbed
} = require('discord.js');

module.exports = {
	name: 'transcript',
	description: 'Télécharger une liste des messages',
	usage: '<ticket-id>',
	aliases: ['archive', 'download', 'dl'],
	example: 'transcript 57',
	args: true,
	async execute(client, message, args, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);
		const id = args[0];

		let ticket = await Ticket.findOne({
			where: {
				id: id,
				open: false
			}
		});


		if (!ticket) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Ticket inconnu**')
					.setDescription('Impossile de trouver un ticket avec cet ID')
					.setFooter(guild.name, guild.iconURL())
			);
		}

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role)) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Commande refusée**')
					.setDescription(`Vous n'avez pas la permission de voir le ticket ${id} étant donné que ce n'est pas le votre et que vous n'êtes pas membre du staff.`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let res = {};
		const embed = new MessageEmbed()
			.setColor(config.colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle(`Ticket ${id}`)
			.setFooter(guild.name, guild.iconURL());

		let file = `../../user/transcripts/text/${ticket.channel}.txt`;
		if (fs.existsSync(join(__dirname, file))) {
			embed.addField('Liste des messages', 'Voir la pièce jointe');
			res.files = [
				{
					attachment: join(__dirname, file),
					name: `ticket-${id}-${ticket.channel}.txt`
				}
			];
		}


		const BASE_URL = config.transcripts.web.server;
		if (config.transcripts.web.enabled) embed.addField('Archive web', `${BASE_URL}/${ticket.creator}/${ticket.channel}`);

		if (embed.fields.length < 1) embed.setDescription(`Aucune donnée de liste des messages existe pour le ticket ${id}`);

		res.embed = embed;

		let channel;
		try {
			channel = message.author.dmChannel || await message.author.createDM();
		} catch (e) {
			channel = message.channel;
		}

		channel.send(res).then(m => {
			if (channel.id === message.channel.id) m.delete({timeout: 15000});
		});
		message.delete({timeout: 1500});
	}
};