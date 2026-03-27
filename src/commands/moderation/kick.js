const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Wyrzuca użytkownika z serwera.')
        .addUserOption(option => 
            option.setName('uzytkownik').setDescription('Kogo wyrzucić?').setRequired(true))
        .addStringOption(option => 
            option.setName('powod').setDescription('Powód wyrzucenia').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('uzytkownik');
        const reason = interaction.options.getString('powod') || 'Brak powodu';
        
        // --- ZMIANA: Sprawdzenie czy użytkownik jest na serwerze ---
        // Dodaję to zabezpieczenie, bo próba kickowania kogoś, kogo nie ma, wyrzuci błąd
        let member;
        try {
             member = await interaction.guild.members.fetch(targetUser.id);
        } catch (e) {
             return interaction.reply({ content: 'Ten użytkownik nie znajduje się na serwerze!', flags: MessageFlags.Ephemeral });
        }
        // -----------------------------------------------------------

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: 'Nie możesz wyrzucić samego siebie!', flags: MessageFlags.Ephemeral });
        }

        try {
            await member.kick(reason);
            
            await interaction.reply({ content: `✅ Wyrzucono **${targetUser.tag}**. Powód: ${reason}`, ephemeral: false });

            const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
            if (settings && settings.logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(settings.logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('👢 Wyrzucono użytkownika (Kick)')
                        .addFields(
                            { name: 'Użytkownik', value: `${targetUser.tag}`, inline: true },
                            { name: 'Administrator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Powód', value: reason }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error(error);
            // Zmiana tutaj:
            await interaction.reply({ content: '❌ Nie udało się wyrzucić użytkownika. Moja rola może być za nisko!', flags: MessageFlags.Ephemeral });
        }
    },
};