const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-kanaly-prywatne')
        .setDescription('Konfiguruje generator kanałów prywatnych (Join to Create).')
        .addChannelOption(option =>
            option.setName('generator')
                .setDescription('Kanał głosowy, na który trzeba wejść (Stwórz)')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kategoria')
                .setDescription('Kategoria, w której będą tworzone nowe kanały')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const generator = interaction.options.getChannel('generator');
        const category = interaction.options.getChannel('kategoria');

        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { 
                'dynamicVoice.generatorChannelId': generator.id,
                'dynamicVoice.categoryId': category.id
            },
            { upsert: true, new: true }
        );

        await interaction.reply({ 
            content: `✅ Skonfigurowano!\n🎤 Generator: **${generator.name}**\n📂 Kategoria: **${category.name}**`,
            flags: MessageFlags.Ephemeral 
        });
    },
};