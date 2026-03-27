const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Wysyła menu wyboru ról (Płeć, Gry, Wiek, Zainteresowania).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.reply({ content: '⏳ Generowanie menu ról...', flags: MessageFlags.Ephemeral });

        const channel = interaction.channel;
        const mainColor = '#9B59B6'; // Fioletowy

        // ====================================================
        // KONFIGURACJA RÓL - NOWE ID
        // ====================================================
        
        // 1. PŁEĆ
        const genderRoles = [
            { label: 'Kobieta', emoji: '👩', id: '1448788848774615129', style: ButtonStyle.Danger },
            { label: 'Mężczyzna', emoji: '👨', id: '1448788848774615130', style: ButtonStyle.Primary }
        ];

        // 2. GRY
        const gamesRoles = [
            { label: 'LOL', emoji: '⚔️', id: '1448788848774615127' },
            { label: 'CS2', emoji: '🔫', id: '1448788848774615126' },
            { label: 'GTA V', emoji: '🔥', id: '1448788848774615124' },
            { label: 'Among Us', emoji: '🔪', id: '1448788848774615125' },
            { label: 'Minecraft', emoji: '⛏️', id: '1448788848774615123' },
            { label: 'OSU!', emoji: '🎵', id: '1448788848732803313' },
            { label: 'Fortnite', emoji: '🧱', id: '1448788848732803312' },
            { label: 'Valorant', emoji: '🛡️', id: '1448788848732803311' }
        ];

        // 3. WIEK
        const ageRoles = [
            { label: '+13', emoji: '🟥', id: '1448788848732803309' },
            { label: '+14', emoji: '🟧', id: '1448788848732803308' }, // Dodane
            { label: '+16', emoji: '🟨', id: '1448788848732803307' },
            { label: '+18', emoji: '🟩', id: '1448788848732803306' },
            { label: '+20', emoji: '🟦', id: '1448788848732803305' },
            { label: '+24', emoji: '⬛', id: '1448788848732803304' }
        ];

        // 4. ZAINTERESOWANIA
        const hobbyRoles = [
            { label: 'Nocny Gracz', emoji: '🌑', id: '1448788848711569628' },
            { label: 'Gotowanie', emoji: '🍴', id: '1448788848711569627' },
            { label: 'Gry', emoji: '📱', id: '1448788848711569626' },
            { label: 'Gaduła', emoji: '📡', id: '1448788848711569625' },
            { label: 'Śpiewak', emoji: '🎤', id: '1448788848711569624' },
            { label: 'Muzyka', emoji: '🎧', id: '1448788848711569623' }
        ];

        // Funkcja pomocnicza do guzików
        const createRows = (roles) => {
            const rows = [];
            let currentRow = new ActionRowBuilder();
            roles.forEach((role, index) => {
                const btn = new ButtonBuilder()
                    .setCustomId(`autorole_${role.id}`)
                    .setLabel(role.label)
                    .setEmoji(role.emoji)
                    .setStyle(role.style || ButtonStyle.Secondary);
                currentRow.addComponents(btn);
                if ((index + 1) % 5 === 0 || index === roles.length - 1) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
            });
            return rows;
        };

        // 1. PŁEĆ
        const genderEmbed = new EmbedBuilder()
            .setTitle('Wybierz swoją płeć')
            .setColor(mainColor);
        await channel.send({ embeds: [genderEmbed], components: createRows(genderRoles) });

        // 2. GRY
        const gamesEmbed = new EmbedBuilder()
            .setTitle('W co grasz')
            .setColor(mainColor);
        await channel.send({ embeds: [gamesEmbed], components: createRows(gamesRoles) });

        // 3. WIEK
        const ageEmbed = new EmbedBuilder()
            .setTitle('Ile masz lat')
            .setColor(mainColor);
        await channel.send({ embeds: [ageEmbed], components: createRows(ageRoles) });

        // 4. ZAINTERESOWANIA
        const hobbyEmbed = new EmbedBuilder()
            .setTitle('Zainteresowania')
            .setColor(mainColor);
        await channel.send({ embeds: [hobbyEmbed], components: createRows(hobbyRoles) });

        await interaction.editReply({ content: '✅ Menu ról zostało zaktualizowane (Nowe ID)!' });
    },
};