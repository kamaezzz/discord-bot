const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antylink')
        .setDescription('Włącza lub wyłącza blokowanie zaproszeń Discord.')
        .addStringOption(option =>
            option.setName('stan')
                .setDescription('Wybierz stan modułu')
                .setRequired(true)
                .addChoices(
                    { name: 'Włączony (ON)', value: 'on' },
                    { name: 'Wyłączony (OFF)', value: 'off' },
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        const stan = interaction.options.getString('stan');
        const isEnabled = stan === 'on';

        let settings = await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { antilink: isEnabled },
            { new: true, upsert: true }
        );

        const statusText = isEnabled ? 'WŁĄCZONY 🟢' : 'WYŁĄCZONY 🔴';
        
        // Zmiana tutaj:
        await interaction.reply({ 
            content: `Pomyślnie zmieniono ustawienia Anty-linku.\nStatus: **${statusText}**`,
            flags: MessageFlags.Ephemeral 
        });
    },
};