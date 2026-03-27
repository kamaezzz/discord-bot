const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Wycisza użytkownika na określony czas (Timeout).')
        .addUserOption(option => 
            option.setName('uzytkownik').setDescription('Kogo wyciszyć?').setRequired(true))
        .addStringOption(option => 
            option.setName('czas').setDescription('Czas trwania (np. 10m, 1h, 1d)').setRequired(true))
        .addStringOption(option => 
            option.setName('powod').setDescription('Powód wyciszenia').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getMember('uzytkownik');
        const timeInput = interaction.options.getString('czas');
        const reason = interaction.options.getString('powod') || 'Brak powodu';
        
        // Sprawdzenie czy użytkownik jest na serwerze
        if (!targetUser) {
            return interaction.reply({ content: '❌ Nie znaleziono użytkownika.', flags: MessageFlags.Ephemeral });
        }

        // Zabezpieczenie przed wyciszeniem admina/bota/siebie
        if (targetUser.id === interaction.user.id) return interaction.reply({ content: '❌ Nie możesz wyciszyć siebie.', flags: MessageFlags.Ephemeral });
        if (targetUser.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ Nie można wyciszyć administratora.', flags: MessageFlags.Ephemeral });

        // Konwersja czasu
        const duration = ms(timeInput);
        if (!duration || duration > 2419200000) { // Limit Discorda to 28 dni
            return interaction.reply({ content: '❌ Nieprawidłowy czas! Użyj np. `5m`, `1h`. Max 28 dni.', flags: MessageFlags.Ephemeral });
        }

        try {
            await targetUser.timeout(duration, reason);
            await interaction.reply({ content: `✅ **${targetUser.user.tag}** został wyciszony na **${timeInput}**.\nPowód: ${reason}`, ephemeral: false });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Błąd. Sprawdź czy moja rola jest wyżej od roli użytkownika.', flags: MessageFlags.Ephemeral });
        }
    },
};