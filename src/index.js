require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Konfiguracja uprawnień bota (Intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Potrzebne do powitań i licznika osób
        GatewayIntentBits.GuildMessages, // Potrzebne do antylinku i logów
        GatewayIntentBits.MessageContent, // Potrzebne, aby bot widział treść wiadomości (antylink)
        GatewayIntentBits.GuildVoiceStates, // Potrzebne do statystyk głosowych
        GatewayIntentBits.GuildMessageReactions // Potrzebne do obsługi reakcji
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

// 1. Ładowanie handlerów (funkcji)
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// (Ten fragment kodu pozwoli nam potem łatwo dodawać komendy w osobnych plikach)
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[OSTRZEŻENIE] Komenda w ${filePath} brakuje wymaganej własności "data" lub "execute".`);
		}
	}
}

// 2. Ładowanie Eventów (np. uruchomienie bota, nowa wiadomość)
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// 3. Połączenie z Bazą Danych i Logowanie
(async () => {
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("Status: Połączono z bazą danych MongoDB.");
        } else {
            console.log("Status: Brak MONGODB_URI w .env - baza danych nieaktywna.");
        }

        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error(`Błąd: ${error}`);
    }
})();