/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'topic',
	description: 'Modifier un sujet de ticket',
	usage: '<topic>',
	aliases: ['edit'],
	example: 'topic besoin d\'aide',
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
			    .setDescription('Utilisez cette commande dans le ticket dont vous voulez modifier le nom, ou mentionnez le ticket.')
			    .addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			    .addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations.`)
			    .setFooter(guild.name, guild.iconURL()));
		}

		let topic = args.join(' ');
		if (topic.length > 256) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Description trop longue**')
					.setDescription('Veuillez limiter vôtre sujet de ticket à 256 lettres. Une phrase courte sera assez.')
					.setFooter(guild.name, guild.iconURL())
			);
		}

		message.channel.setTopic(`<@${ticket.creator}> | ` + topic);

		Ticket.update({
			topic: topic
		}, {
			where: {
				channel: message.channel.id
			}
		});

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket mis à jour**')
				.setDescription('Le sujet à été changé.')
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};