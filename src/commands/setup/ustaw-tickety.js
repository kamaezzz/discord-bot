const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ustaw-tickety')
        .setDescription('Konfiguruje system ticketów i wysyła panel.')
        .addChannelOption(option =>
            option.setName('kategoria')
                .setDescription('Kategoria, w której będą tworzone tickety')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rola-support')
                .setDescription('Rola, która ma dostęp do ticketów (np. Moderator)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kanal-logow')
                .setDescription('Gdzie wysyłać zapisane rozmowy (transkrypty)?')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const category = interaction.options.getChannel('kategoria');
        const role = interaction.options.getRole('rola-support');
        const logsChannel = interaction.options.getChannel('kanal-logow');

        // Zapis konfiguracji do bazy
        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { 
                'ticketSystem.categoryId': category.id,
                'ticketSystem.supportRoleId': role.id,
                'ticketSystem.transcriptChannelId': logsChannel.id
            },
            { upsert: true, new: true }
        );

        // Tworzenie Panelu Ticketów
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📬 Centrum Pomocy')
            .setDescription('Potrzebujesz pomocy administracji?\nKliknij przycisk poniżej, aby otworzyć prywatne zgłoszenie.')
            .setFooter({ text: 'Twoje zgłoszenie będzie widoczne tylko dla Ciebie i Administracji.' });

        const button = new ButtonBuilder()
            .setCustomId('btn_create_ticket')
            .setLabel('Stwórz zgłoszenie')
            .setEmoji('📩')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        // Wysłanie panelu
        await interaction.channel.send({ embeds: [embed], components: [row] });

        await interaction.reply({ 
            content: `✅ Skonfigurowano system ticketów!\n📂 Kategoria: **${category.name}**\n🛡️ Rola: **${role.name}**\n📜 Logi: ${logsChannel}`,
            flags: MessageFlags.Ephemeral 
        });
    },
};