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

module.exports = {
	name: 'tickets',
	description: 'Liste la liste des messages de vos tickets récents.',
	usage: '[@membre]',
	aliases: ['list'],
	args: false,
	async execute(client, message, args, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);

		const supportRole = guild.roles.cache.get(config.staff_role);
		if (!supportRole) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setTitle('❌ **Erreur**')
					.setDescription(`${config.name} has not been set up correctly. Could not find a 'support team' role with the id \`${config.staff_role}\``)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let context = 'self';
		let user = message.mentions.users.first() || guild.members.cache.get(args[0]);

		if (user) {
			if (!message.member.roles.cache.has(config.staff_role)) {
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
					  .setTitle('❌ **Commande refusée**')
					  .setDescription(`Vous n'êtes pas autorisé à lister les tickets des autres parce que vous n'êtes pas membre du staff.`)
					  .addField('Utilisation', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					  .addField('Aide', `Ecrivez \`${config.prefix}help ${this.name}\` pour plus d'informations`)
					  .setFooter(guild.name, guild.iconURL())
				);
			}

			context = 'staff';
		} else user = message.author;

		let openTickets = await Ticket.findAndCountAll({
			where: {
				creator: user.id,
				open: true
			}
		});

		let closedTickets = await Ticket.findAndCountAll({
			where: {
				creator: user.id,
				open: false
			}
		});

		closedTickets.rows = closedTickets.rows.slice(-10); // get most recent 10

		let embed = new MessageEmbed()
			.setColor(config.colour)
			.setAuthor(user.username, user.displayAvatarURL())
			.setTitle(`${context === 'self' ? 'Vos tickets' : 'Tickets de ' + user.username}`)
			.setFooter(guild.name + ' | Ce message va être supprimé dans 1 minute', guild.iconURL());

		/* if (config.transcripts.web.enabled) {
			embed.setDescription(`You can access all of your ticket archives on the [web portal](${config.transcripts.web.server}/${user.id}).`);
		} */

		let open = [],
			closed = [];

		for (let t in openTickets.rows)  {
			let desc = openTickets.rows[t].topic.substring(0, 30);
			open.push(`> <#${openTickets.rows[t].channel}>: \`${desc}${desc.length > 20 ? '...' : ''}\``);
		}

		for (let t in closedTickets.rows)  {
			let desc = closedTickets.rows[t].topic.substring(0, 30);
			let transcript = '';
			let c = closedTickets.rows[t].channel;
			if (config.transcripts.web.enabled || fs.existsSync(join(__dirname, `../../user/transcripts/text/${c}.txt`))) {
				transcript = `\n> Ecrivez \`${config.prefix}transcript ${closedTickets.rows[t].id}\` pour voir.`;
			}

			closed.push(`> **#${closedTickets.rows[t].id}**: \`${desc}${desc.length > 20 ? '...' : ''}\`${transcript}`);

		}

		let pre = context === 'self' ? 'Vous avez' : user.username + ' a';
		embed.addField('Tickets ouverts', openTickets.count === 0 ? `${pre} aucun tickets ouverts.` : open.join('\n\n'), false);
		embed.addField('Tickets fermés', closedTickets.count === 0 ? `${pre} pas d'anciens tickets` : closed.join('\n\n'), false);

		message.delete({timeout: 15000});

		let channel;
		try {
			channel = message.author.dmChannel || await message.author.createDM();
			message.channel.send('Envoyé en DM').then(msg => msg.delete({timeout: 15000}));
		} catch (e) {
			channel = message.channel;
		}

		let m = await channel.send(embed);
		m.delete({timeout: 60000});
	},
};