const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Tworzy i wysyła ładną wiadomość w ramce (Embed).')
        .addStringOption(option =>
            option.setName('tytul')
                .setDescription('Nagłówek wiadomości')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opis')
                .setDescription('Treść (użyj \\n dla nowej linii)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Gdzie wysłać?')
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('kolor')
                .setDescription('Kolor paska (np. #9B59B6)'))
        .addAttachmentOption(option =>
            option.setName('obrazek')
                .setDescription('Duży obrazek na dole'))
        .addStringOption(option =>
            option.setName('przycisk-nazwa')
                .setDescription('Napis na przycisku (opcjonalne)'))
        .addStringOption(option =>
            option.setName('przycisk-link')
                .setDescription('Link, gdzie ma prowadzić przycisk (opcjonalne)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const title = interaction.options.getString('tytul');
        const description = interaction.options.getString('opis').replace(/\\n/g, '\n');
        const channel = interaction.options.getChannel('kanal') || interaction.channel;
        const color = interaction.options.getString('kolor') || '#9B59B6'; // Domyślny fiolet
        const image = interaction.options.getAttachment('obrazek');
        const btnLabel = interaction.options.getString('przycisk-nazwa');
        const btnLink = interaction.options.getString('przycisk-link');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Wysłane przez: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (image) embed.setImage(image.url);

        // Obsługa przycisku
        const components = [];
        if (btnLabel && btnLink) {
            // Sprawdzenie czy link jest poprawny (zaczyna się od http)
            if (!btnLink.startsWith('http')) {
                return interaction.reply({ content: '❌ Link musi zaczynać się od http:// lub https://', flags: MessageFlags.Ephemeral });
            }

            const button = new ButtonBuilder()
                .setLabel(btnLabel)
                .setStyle(ButtonStyle.Link)
                .setURL(btnLink)
                .setEmoji('🔗');

            const row = new ActionRowBuilder().addComponents(button);
            components.push(row);
        }

        try {
            await channel.send({ embeds: [embed], components: components });
            
            await interaction.reply({ 
                content: `✅ Wiadomość została wysłana na kanał ${channel}!`,
                flags: MessageFlags.Ephemeral 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ Nie udało się wysłać wiadomości.',
                flags: MessageFlags.Ephemeral 
            });
        }
    },
};