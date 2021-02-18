/**
 * ###############################################################################################
 *  ____                                        _     _____              _             _
 * |  _ \  (_)  ___    ___    ___    _ __    __| |   |_   _| (_)   ___  | | __   ___  | |_   ___
 * | | | | | | / __|  / __|  / _ \  | '__|  / _` |     | |   | |  / __| | |/ /  / _ \ | __| / __|
 * | |_| | | | \__ \ | (__  | (_) | | |    | (_| |     | |   | | | (__  |   <  |  __/ | |_  \__ \
 * |____/  |_| |___/  \___|  \___/  |_|     \__,_|     |_|   |_|  \___| |_|\_\  \___|  \__| |___/
 *
 * ---------------------
 *      Quick Start
 * ---------------------
 *
 * 	> For detailed instructions, visit the GitHub repository and read the documentation:
 * 	https://github.com/eartharoid/DiscordTickets/wiki
 *
 * 	> IMPORTANT: Also edit the TOKEN in 'user/.env'
 *
 * ---------------------
 *       Support
 * ---------------------
 *
 * 	> Information: https://github.com/eartharoid/DiscordTickets/#readme
 * 	> Discord Support Server: https://go.eartharoid.me/discord
 * 	> Wiki: https://github.com/eartharoid/DiscordTickets/wiki
 *
 * ###############################################################################################
 */

module.exports = {
	prefix: 't_',
	name: 'AkumuTicket',
	presences: [
		{
			activity: '%snew',
			type: 'PLAYING'
		},
		{
			activity: 'avec des tickets',
			type: 'PLAYING'
		},
		{
			activity: 'des nouveaux tickets',
			type: 'WATCHING'
		}
	],
	append_presence: ' | %shelp',
	colour: '#009999',
	err_colour: 'RED',
	cooldown: 3,
	guild: '806938920503345184', // ID of your guild (REQUIRED)
	staff_role: '806946417661706262', // ID of your Support Team role (REQUIRED)

	tickets: {
		category: '807213198340128799', // ID of your tickets category (REQUIRED)
		send_img: true,
		ping: 'here',
		text: `Bonjour, {{ tag }}!
		Un membre du staff va venir vous aider dans un instant.
		En attendant, veuillez décrire votre problème le plus précisément possible! :)`,
		pin: false,
		max: 3,
		default_topic: {
			command: 'Aucun sujet donné',
			panel: 'Créé via le panel'
		}
	},

	commands: {
		close: {
			confirmation: true,
			send_transcripts: true
		},
		delete: {
			confirmation: true
		},
		new: {
			enabled: true
		},
		closeall: {
			enabled: true,
		},
	},

	transcripts: {
		text: {
			enabled: true,
			keep_for: 90,
		},
		web: {
			enabled: false,
			server: 'https://tickets.example.com',
		},
		channel: '811511241947217921' // ID of your archives channel
	},

	panel: {
		title: 'Tickets de support',
		description: 'Besoin d\'aide ? Aucun problème ! Réagissez à ce message pour créer un nouveau ticket de support pour qu\'un admin puisse vous aider.',
		reaction: '🧾'
	},

	storage: {
		type: 'sqlite'
	},

	logs: {
		files: {
			enabled: true,
			keep_for: 7
		},
		discord: {
			enabled: true,
			channel: '811202400094257223' // ID of your log channel
		}
	},

	debug: true,
	updater: false
};
