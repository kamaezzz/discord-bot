const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-kanal-valorant')
        .setDescription('Ustawia kanał, gdzie można używać tylko komendy /valorant (zwykłe wiadomości będą usuwane).')
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
            { valorantChannelId: channel.id },
            { upsert: true, new: true }
        );

        await interaction.reply({ 
            content: `✅ Ustawiono kanał Valorant: ${channel}\n\n👉 **Ważne:** Upewnij się, że w ustawieniach tego kanału rola @everyone ma **ZEZWOLENIE** na "Wysyłanie wiadomości". Bot sam będzie usuwał zbędny tekst.`,
            flags: MessageFlags.Ephemeral 
        });
    },
};