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
const config = require(join(__dirname, '../../user/', require('../').config));

module.exports = {
	name: 'new',
	description: 'Crée un ticket',
	usage: '[description rapide]',
	aliases: ['ticket', 'open'],
	example: 'new problème dans le serveur',
	args: false,
	disabled: !config.commands.new.enabled,
	async execute(client, message, args, log, {config, Ticket}) {

		if (!config.commands.new.enabled) return; // stop if the command is disabled


		const guild = client.guilds.cache.get(config.guild);

		const supportRole = guild.roles.cache.get(config.staff_role);
		
		if (!supportRole)
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setTitle('❌ **Erreur**')
					.setDescription(`${config.name} has not been set up correctly. Could not find a 'support team' role with the id \`${config.staff_role}\``)
					.setFooter(guild.name, guild.iconURL())
			);


		let tickets = await Ticket.findAndCountAll({
			where: {
				creator: message.author.id,
				open: true
			},
			limit: config.tickets.max
		});

		if (tickets.count >= config.tickets.max) {
			let ticketList = [];
			for (let t in tickets.rows) {
				let desc = tickets.rows[t].topic.substring(0, 30);
				ticketList
					.push(`<#${tickets.rows[t].channel}>: \`${desc}${desc.length > 30 ? '...' : ''}\``);
			}

			let m = await message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle(`❌ **Vous avez déjà  ${tickets.count} tickets ouvert ou plus.**`)
					.setDescription(`Utilisez \`${config.prefix}close\` pour fermer des tickets inutiles.\n\n${ticketList.join(',\n')}`)
					.setFooter(guild.name + ' | Ce message va être supprimé dans 15 secondes', guild.iconURL())
			);

			return setTimeout(async () => {
				await message.delete();
				await m.delete();
			}, 15000);
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
		else if (topic.length < 1) {
			topic = config.tickets.default_topic.command;
		}

		let ticket = await Ticket.create({
			channel: '',
			creator: message.author.id,
			open: true,
			archived: false,
			topic: topic
		});

		let name = 'ticket-' + ticket.get('id');

		guild.channels.create(name, {
			type: 'text',
			topic: `${message.author} | ${topic}`,
			parent: config.tickets.category,
			permissionOverwrites: [{
				id: guild.roles.everyone,
				deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
			},
			{
				id: client.user,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
			},
			{
				id: message.member,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
			},
			{
				id: supportRole,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
			}
			],
			reason: 'Un utilisateur a créé un ticket'
		}).then(async c => {

			Ticket.update({
				channel: c.id
			}, {
				where: {
					id: ticket.id
				}
			});

			let m = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('✅ **Ticket créé**')
					.setDescription(`Votre ticket a été créé: ${c}`)
					.setFooter(client.user.username + ' | Ce message va être supprimé dans 15 secondes', client.user.displayAvatarURL())
			);

			setTimeout(async () => {
				await message.delete();
				await m.delete();
			}, 15000);

			// require('../modules/archive').create(client, c); // create files

			let ping;
			switch (config.tickets.ping) {
			case 'staff':
				ping = `<@&${config.staff_role}>,\n`;
				break;
			case false:
				ping = '';
				break;
			default:
				ping = `@${config.tickets.ping},\n`;
			}

			await c.send(ping + `${message.author} a créé un ticket`);

			if (config.tickets.send_img) {
				const images = fs.readdirSync(join(__dirname, '../../user/images'));
				await c.send({
					files: [
						join(__dirname, '../../user/images', images[Math.floor(Math.random() * images.length)])
					]
				});
			}

			let text = config.tickets.text
				.replace(/{{ ?name ?}}/gmi, message.author.username)
				.replace(/{{ ?(tag|mention) ?}}/gmi, message.author);


			let w = await c.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setDescription(text)
					.addField('Sujet', `\`${topic}\``)
					.setFooter(guild.name, guild.iconURL())
			);

			if (config.tickets.pin) await w.pin();
			// await w.pin().then(m => m.delete()); // oopsie, this deletes the pinned message

			if (config.logs.discord.enabled)
				client.channels.cache.get(config.logs.discord.channel).send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle('Nouveau ticket')
						.setDescription(`\`${topic}\``)
						.addField('Créateur', message.author, true)
						.addField('Salon', c, true)
						.setFooter(guild.name, guild.iconURL())
						.setTimestamp()
				);

			log.info(`${message.author.tag} a créé un ticket (#${name})`);


		}).catch(log.error);

	},
};
