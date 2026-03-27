const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-weryfikacje')
        .setDescription('Wysyła panel weryfikacyjny.')
        .addRoleOption(option =>
            option.setName('rola')
                .setDescription('Rola, którą użytkownik otrzyma po weryfikacji')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const rola = interaction.options.getRole('rola');

        // Zapis do bazy
        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { verifiedRoleId: rola.id },
            { upsert: true, new: true }
        );

        // Tworzymy Embed (Fioletowy, nazwa serwera w tytule)
        const verifyEmbed = new EmbedBuilder()
            .setColor('#9B59B6') // Fioletowy
            .setTitle(`Weryfikacja ${interaction.guild.name}`) // Pobiera nazwę serwera
            .setDescription('Kliknij przycisk poniżej, aby się zweryfikować i uzyskać dostęp do serwera.')
            .setFooter({ text: 'System bezpieczeństwa' });

        const verifyButton = new ButtonBuilder()
            .setCustomId('btn_weryfikacja')
            .setLabel('Zweryfikuj się')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const row = new ActionRowBuilder().addComponents(verifyButton);

        await interaction.channel.send({ embeds: [verifyEmbed], components: [row] });

        await interaction.reply({ 
            content: `✅ Panel weryfikacji wysłany! Rola: ${rola}`,
            flags: MessageFlags.Ephemeral 
        });
    },
};