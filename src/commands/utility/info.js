const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Wyświetla listę wszystkich dostępnych komend.'),

    async execute(interaction) {
        const commandsPath = path.join(__dirname, '../../commands');
        const commandFolders = fs.readdirSync(commandsPath);

        const embed = new EmbedBuilder()
            .setColor('#5865F2') // Kolor Discord Blurple
            .setTitle('🤖 Centrum Pomocy Bota')
            .setDescription('Oto lista wszystkich dostępnych komend podzielona na kategorie:')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Zażądano przez: ${interaction.user.tag}` })
            .setTimestamp();

        // Tłumaczenie nazw folderów na ładne nazwy kategorii
        const categoryNames = {
            moderation: '👮 Moderacja i Administracja',
            utility: '🛠️ Narzędzia',
            setup: '⚙️ Konfiguracja',
            community: '🎉 Społeczność (Giveaway)',
            // Jeśli dodasz inne foldery, dopisz je tutaj
        };

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            // Tworzymy listę komend w danej kategorii
            // Format: `komenda` - Opis
            const fileList = commandFiles.map(file => {
                const cmd = require(path.join(folderPath, file));
                if (cmd.data && cmd.data.name) {
                    return `**/ ${cmd.data.name}** - ${cmd.data.description}`;
                }
                return null;
            }).filter(Boolean).join('\n'); // Usuwamy puste i łączymy nową linią

            // Jeśli kategoria nie jest pusta, dodajemy ją do embeda
            if (fileList) {
                const categoryTitle = categoryNames[folder] || folder.toUpperCase(); // Używa tłumaczenia lub nazwy folderu
                embed.addFields({ name: categoryTitle, value: fileList });
            }
        }

        await interaction.reply({ embeds: [embed] });
    },
};