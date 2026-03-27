const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Sprawdza opóźnienie bota (Ping).'),
	async execute(interaction) {
		await interaction.reply(`Pong! Opóźnienie: ${Date.now() - interaction.createdTimestamp}ms.`);
	},
};