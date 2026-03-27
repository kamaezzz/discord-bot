const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-statystyki')
        .setDescription('Ustawia kanały wyświetlające statystyki serwera.')
        .addChannelOption(option =>
            option.setName('kanal-licznik')
                .setDescription('Kanał głosowy dla liczby osób')
                .addChannelTypes(ChannelType.GuildVoice) // Pozwalamy wybrać tylko kanał głosowy
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kanal-ostatni')
                .setDescription('Kanał głosowy dla ostatniej osoby')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const countChannel = interaction.options.getChannel('kanal-licznik');
        const lastChannel = interaction.options.getChannel('kanal-ostatni');

        // Zapisujemy w bazie
        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { 
                memberCountChannelId: countChannel.id,
                lastMemberChannelId: lastChannel.id
            },
            { upsert: true, new: true }
        );

        // Próbujemy od razu zaktualizować nazwy, żeby było widać efekt
        try {
            await countChannel.setName(`👥・Osoby: ${interaction.guild.memberCount}`);
            await lastChannel.setName(`🆕・Nikt (Start)`); // Zmieni się jak ktoś wejdzie
        } catch (error) {
            console.log("Błąd zmiany nazwy przy konfiguracji (możliwy Rate Limit):", error);
        }

        await interaction.reply({ 
            content: `✅ Pomyślnie skonfigurowano statystyki!\nLicznik: ${countChannel}\nOstatnia osoba: ${lastChannel}`,
            flags: MessageFlags.Ephemeral 
        });
    },
};