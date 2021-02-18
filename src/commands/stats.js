/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'stats',
	description: 'Voir des stats des tickets',
	usage: '',
	aliases: ['data', 'statistics'],
	
	args: false,
	async execute(client, message, _args, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);

		let open = await Ticket.count({ where: { open: true } });
		let closed = await Ticket.count({ where: { open: false } });

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setTitle(':bar_chart: Statistiques')
				.addField('Tickets ouverts', open, true)
				.addField('Tickets fermés', closed, true)
				.addField('Total de tickets', open + closed, true)
				.setFooter(guild.name, guild.iconURL())
		);
	}
};