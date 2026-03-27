const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-logi')
        .setDescription('Ustawia kanał do logów serwerowych.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Wybierz kanał tekstowy')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        const kanal = interaction.options.getChannel('kanal');

        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { logChannelId: kanal.id },
            { upsert: true, new: true }
        );

        // Zmiana tutaj:
        await interaction.reply({ 
            content: `✅ Pomyślnie ustawiono kanał logów na: ${kanal}`,
            flags: MessageFlags.Ephemeral 
        });
    },
};