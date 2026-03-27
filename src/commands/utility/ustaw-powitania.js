const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-powitania')
        .setDescription('Konfiguruje kanały powitań i pożegnań.')
        .addChannelOption(option =>
            option.setName('powitania')
                .setDescription('Kanał dla wiadomości powitalnych')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('pozegnania')
                .setDescription('Kanał dla wiadomości pożegnalnych')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const welcomeChannel = interaction.options.getChannel('powitania');
        const leaveChannel = interaction.options.getChannel('pozegnania');

        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { 
                welcomeChannelId: welcomeChannel.id,
                leaveChannelId: leaveChannel.id
            },
            { upsert: true, new: true }
        );

        await interaction.reply({ 
            content: `✅ Skonfigurowano!\n👋 Powitania: ${welcomeChannel}\n🚪 Pożegnania: ${leaveChannel}`,
            flags: MessageFlags.Ephemeral 
        });
    },
};