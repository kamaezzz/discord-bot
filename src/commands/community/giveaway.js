const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ms = require('ms');
const Giveaway = require('../../models/Giveaway');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Rozpoczyna konkurs na serwerze.')
        .addStringOption(option =>
            option.setName('czas')
                .setDescription('Czas trwania (np. 10m, 1h, 2d)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('zwyciezcy')
                .setDescription('Liczba zwycięzców')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('nagroda')
                .setDescription('Co jest do wygrania?')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Tylko dla zarządzających

    async execute(interaction) {
        const timeInput = interaction.options.getString('czas');
        const winnersCount = interaction.options.getInteger('zwyciezcy');
        const prize = interaction.options.getString('nagroda');

        // Konwersja czasu
        const duration = ms(timeInput);
        if (!duration) {
            return interaction.reply({ content: '❌ Podałeś nieprawidłowy format czasu! Użyj np. `10m`, `1h`, `1d`.', flags: MessageFlags.Ephemeral });
        }

        const endTime = Date.now() + duration;

        // Tworzenie wyglądu wiadomości
        const giveawayEmbed = new EmbedBuilder()
            .setColor('#FF0055') // Różowy kolor, typowy dla giveaway
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`Do wygrania: **${prize}**\n\n🕒 Koniec: <t:${Math.floor(endTime / 1000)}:R>\n👑 Liczba zwycięzców: **${winnersCount}**\n👤 Organizator: ${interaction.user}`)
            .setFooter({ text: 'Kliknij przycisk poniżej, aby dołączyć!' })
            .setTimestamp(endTime);

        const joinButton = new ButtonBuilder()
            .setCustomId('btn_giveaway_join')
            .setLabel('Dołącz (0)')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinButton);

        // Wysłanie wiadomości
        const message = await interaction.channel.send({ embeds: [giveawayEmbed], components: [row] });

        // Zapisanie do bazy danych
        const newGiveaway = new Giveaway({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: message.id,
            prize: prize,
            endTime: endTime,
            winnersCount: winnersCount,
            hostId: interaction.user.id,
            participants: []
        });

        await newGiveaway.save();

        await interaction.reply({ content: `✅ Konkurs wystartował!`, flags: MessageFlags.Ephemeral });
    },
};