/**
 *
 *  @name DiscordTickets
 *  @author iFusion for eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'rename',
	description: 'Renommer un ticket',
	usage: '<new name>',
	aliases: ['none'],
	example: 'rename important-ticket',
	args: true,
	async execute(client, message, args, {config, Ticket}) {
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
			    .setDescription('Utilisez cette commande dans le ticket que vous voulez renommer, ou mentionnez le ticket.')
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
					.setDescription(`Vous n'êtes pas autorisé à modifier ${channel} parce qu'il ne vous appartient pas et que vous n'êtes pas membre du staff.`)
					.addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
					.setFooter(guild.name, guild.iconURL()
			));

		message.channel.setName(args.join('-')); // new channel name

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket mis à jour**')
				.setDescription('Le nom à été changé.')
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};
