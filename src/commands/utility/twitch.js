const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const TwitchStreamer = require('../../models/TwitchStreamer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('twitch')
        .setDescription('Zarządzanie powiadomieniami o streamach.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('dodaj')
                .setDescription('Dodaje streamera do obserwowanych.')
                .addStringOption(option => option.setName('nazwa').setDescription('Nazwa na Twitchu (np. izakooo)').setRequired(true))
                .addChannelOption(option => option.setName('kanal').setDescription('Gdzie wysyłać powiadomienia?').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('usun')
                .setDescription('Przestaje obserwować streamera.')
                .addStringOption(option => option.setName('nazwa').setDescription('Nazwa na Twitchu').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subCmd = interaction.options.getSubcommand();
        const streamerName = interaction.options.getString('nazwa').toLowerCase(); // Twitch używa małych liter w loginach

        if (subCmd === 'dodaj') {
            const channel = interaction.options.getChannel('kanal');

            // Sprawdź czy już nie obserwujemy tego streamera na tym serwerze
            const exists = await TwitchStreamer.findOne({ 
                guildId: interaction.guild.id, 
                twitchLogin: streamerName 
            });

            if (exists) {
                return interaction.reply({ content: `❌ Już obserwujesz streamera **${streamerName}** na tym serwerze!`, flags: MessageFlags.Ephemeral });
            }

            const newStreamer = new TwitchStreamer({
                guildId: interaction.guild.id,
                channelId: channel.id,
                twitchLogin: streamerName,
                isLive: false
            });

            await newStreamer.save();
            await interaction.reply({ content: `✅ Dodano streamera **${streamerName}**. Powiadomienia będą na kanale ${channel}.`, flags: MessageFlags.Ephemeral });

        } else if (subCmd === 'usun') {
            const deleted = await TwitchStreamer.findOneAndDelete({ 
                guildId: interaction.guild.id, 
                twitchLogin: streamerName 
            });

            if (!deleted) {
                return interaction.reply({ content: `❌ Nie obserwujesz takiego streamera: **${streamerName}**.`, flags: MessageFlags.Ephemeral });
            }

            await interaction.reply({ content: `🗑️ Usunięto **${streamerName}** z listy obserwowanych.`, flags: MessageFlags.Ephemeral });
        }
    },
};