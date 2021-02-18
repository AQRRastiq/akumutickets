/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'help',
	description: 'Affiche le menu d\'aide',
	usage: '[commande]',
	aliases: ['command', 'commands'],
	example: 'help new',
	args: false,
	execute(client, message, args, log, {config}) {
		const guild = client.guilds.cache.get(config.guild);

		const commands = Array.from(client.commands.values());

		if (!args.length) {
			let cmds = [];

			for (let command of commands) {
				if (command.hide || command.disabled) continue;
				if (command.permission && !message.member.hasPermission(command.permission)) continue;

				let desc = command.description;

				if (desc.length > 50) desc = desc.substring(0, 50) + '...';
				cmds.push(`**${config.prefix}${command.name}** **·** ${desc}`);
			}

			message.channel.send(
				new MessageEmbed()
					.setTitle('Commandes')
					.setColor(config.colour)
					.setDescription(
						`\nLes commandes dont vous avez accès sot listées ci-dessous. Ecrivez \`${config.prefix}help [commande]\` pour plus d'information à propos d'une commande.
						\n${cmds.join('\n\n')}
						\nVeuillez contacter un membre du staff si vous avez besoin d'aide.`
					)
					.setFooter(guild.name, guild.iconURL())
			).catch((error) => {
				log.warn('Impossible d\'envoyer le menu d\'aide');
				log.error(error);
			});

		} else {
			const name = args[0].toLowerCase();
			const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command)
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setDescription(`❌ **Nom de commande invalide** (\`${config.prefix}help\`)`)
				);


			const cmd = new MessageEmbed()
				.setColor(config.colour)
				.setTitle(command.name);


			if (command.long) cmd.setDescription(command.long);
			else cmd.setDescription(command.description);

			if (command.aliases) cmd.addField('Alias', `\`${command.aliases.join(', ')}\``, true);

			if (command.usage) cmd.addField('Utilisation', `\`${config.prefix}${command.name} ${command.usage}\``, false);

			if (command.usage) cmd.addField('Exemple', `\`${config.prefix}${command.example}\``, false);


			if (command.permission && !message.member.hasPermission(command.permission)) {
				cmd.addField('Permission demandée', `\`${command.permission}\` :exclamation: Vous n'avez pas cette permission !`, true);
			} else cmd.addField('Permission demandée', `\`${command.permission || 'none'}\``, true);

			message.channel.send(cmd);
		}

		// command ends here
	},
};