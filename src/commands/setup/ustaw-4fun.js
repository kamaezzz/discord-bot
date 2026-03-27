const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-4fun')
        .setDescription('Konfiguruje kanały do gier i zabaw (4FUN).')
        .addChannelOption(option =>
            option.setName('liczenie')
                .setDescription('Wybierz kanał do liczenia (1, 2, 3...)')
                .addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option =>
            option.setName('ostatnia-litera')
                .setDescription('Wybierz kanał do gry w słowa/ostatnią literę')
                .addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option =>
            option.setName('emotki')
                .setDescription('Wybierz kanał tylko dla emotek')
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const countingChannel = interaction.options.getChannel('liczenie');
        const letterChannel = interaction.options.getChannel('ostatnia-litera');
        const emojiChannel = interaction.options.getChannel('emotki');

        // Pobieramy obecne ustawienia lub tworzymy nowe
        let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
        if (!settings) {
            settings = new GuildSettings({ guildId: interaction.guild.id });
        }

        let info = 'Zaktualizowano ustawienia 4FUN:\n';

        if (countingChannel) {
            settings.fourFun.countingChannelId = countingChannel.id;
            // Resetujemy licznik przy zmianie kanału, dla bezpieczeństwa
            settings.fourFun.currentCount = 0; 
            settings.fourFun.lastCountUser = null;
            info += `🔢 Liczenie: ${countingChannel}\n`;
        }
        
        if (letterChannel) {
            settings.fourFun.lastLetterChannelId = letterChannel.id;
            settings.fourFun.currentLastLetter = null; // Reset literki
            info += `🔤 Ostatnia litera: ${letterChannel}\n`;
        }

        if (emojiChannel) {
            settings.fourFun.emojiChannelId = emojiChannel.id;
            info += `😀 Tylko emotki: ${emojiChannel}\n`;
        }

        if (!countingChannel && !letterChannel && !emojiChannel) {
            return interaction.reply({ content: '⚠️ Nie wybrałeś żadnego kanału do konfiguracji!', flags: MessageFlags.Ephemeral });
        }

        await settings.save();
        await interaction.reply({ content: info, flags: MessageFlags.Ephemeral });
    },
};