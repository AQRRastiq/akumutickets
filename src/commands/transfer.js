/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'transfer',
	description: 'Transférer le propriétaire d\'un ticket',
	usage: '<@membre>',
	aliases: ['none'],
	example: 'transfer @utilisateur',
	args: true,
	async execute(client, message, args, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		let ticket = await Ticket.findOne({
			where: {
				channel: message.channel.id
			}
		});

		if (!ticket) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
			    .setTitle('❌ **Ce salon n\'est pas un ticket**')
			    .setDescription('Utilisez cette commande dans le ticket dont vous voulez changer le propriétaire, ou mentionnez le ticket.')
			    .addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			    .addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations.`)
			    .setFooter(guild.name, guild.iconURL()));
		}

		if (!message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Commande refusée**')
					.setDescription('Vous n\'avez pas la permission de changer le propriétaire du ticket puisque vous n\'êtes pas membre du staff.')
					.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
					.setFooter(guild.name, guild.iconURL())
			);

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Membre inconnu**')
					.setDescription('Veuillez mentionner un membre valide.')
					.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
					.setFooter(guild.name, guild.iconURL())
			);
		}


		message.channel.setTopic(`${member} | ${ticket.topic}`);

		Ticket.update({
			creator: member.user.id
		}, {
			where: {
				channel: message.channel.id
			}
		});

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket transféré**')
				.setDescription(`Le propriétaire de ce ticket est maintenant ${member}.`)
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};
