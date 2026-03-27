require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
// Szukamy folderów wewnątrz 'commands'
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[OSTRZEŻENIE] Komenda w ${filePath} brakuje "data" lub "execute".`);
		}
	}
}

// Przygotowanie REST API
const rest = new REST().setToken(process.env.TOKEN);

// Wysłanie komend
(async () => {
	try {
		console.log(`Rozpoczynam odświeżanie ${commands.length} komend (/)...`);

		// Używamy Routes.applicationGuildCommands, aby komendy pojawiły się natychmiast na serwerze testowym
        // (Komendy globalne mogą się aktualizować do godziny, serwerowe są od razu)
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);

		console.log(`Pomyślnie załadowano ${data.length} komend (/).`);
	} catch (error) {
		console.error(error);
	}
})();