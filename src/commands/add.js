/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'add',
	description: 'Ajoute un utilisateur à un ticket',
	usage: '<@membre> [... #salon]',
	aliases: ['none'],
	example: 'add @membre to #ticket-23',
	args: true,
	async execute(client, message, args, log, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Ce salon n\'est pas un ticket**')
			.setDescription('Utilisez cette commande dans le ticket auquel vous voulez ajouter un utilisateur, ou mentionnez le ticket.')
			.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations.`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;

		let channel = message.mentions.channels.first();

		if (!channel) {
			channel = message.channel;
			ticket = await Ticket.findOne({ where: { channel: message.channel.id } });
			if (!ticket) return message.channel.send(notTicket);

		} else {
			ticket = await Ticket.findOne({ where: { channel: channel.id } });
			if (!ticket) {
				notTicket
					.setTitle('❌ **Ce salon n\'est pas un ticket**')
					.setDescription(`${channel} n'est pas un ticket.`);
				return message.channel.send(notTicket);
			}
		}

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role)) {
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
		}

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Membre inconnu**')
					.setDescription('Veuillez mentionner un membre valide.')
					.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'infomations.`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		try {
			channel.updateOverwrite(member.user, {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
				ATTACH_FILES: true,
				READ_MESSAGE_HISTORY: true
			});

			if (channel.id !== message.channel.id) {
				channel.send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(member.user.username, member.user.displayAvatarURL())
						.setTitle('**Membre ajouté**')
						.setDescription(`${member} à été ajouté par ${message.author}`)
						.setFooter(guild.name, guild.iconURL())
				);
			}

			message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle('✅ **Membre ajouté**')
					.setDescription(`${member} à été ajouté à <#${ticket.channel}>`)
					.setFooter(guild.name, guild.iconURL())
			);

			log.info(`${message.author.tag} à ajouté un utilisateur au ticket (#${message.channel.id})`);
		} catch (error) {
			log.error(error);
		}
		// command ends here
	},
};
