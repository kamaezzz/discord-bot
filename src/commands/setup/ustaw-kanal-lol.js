const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-kanal-lol')
        .setDescription('Ustawia kanał, gdzie można używać tylko komendy /lol.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Wybierz kanał')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('kanal');

        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { lolChannelId: channel.id },
            { upsert: true, new: true }
        );

        await interaction.reply({ 
            content: `✅ Ustawiono kanał League of Legends: ${channel}\n\n👉 Wiadomości tekstowe będą tu usuwane, dozwolona tylko komenda **/lol**.`,
            flags: MessageFlags.Ephemeral 
        });
    },
};