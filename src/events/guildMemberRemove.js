const { Events, EmbedBuilder } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const settings = await GuildSettings.findOne({ guildId: member.guild.id });
        if (!settings) return;

        // =================================================================
        // KROK 1: NAJPIERW WYSYŁAMY POŻEGNANIE (BŁYSKAWICZNIE)
        // =================================================================
        if (settings.leaveChannelId) {
            const channel = member.guild.channels.cache.get(settings.leaveChannelId);
            if (channel) {
                const leaveEmbed = new EmbedBuilder()
                    .setColor('#9B59B6') // Fioletowy
                    .setTitle('Użytkownik opuścił serwer')
                    .setDescription(`Kocur **${member.user.tag}** opuścił serwer! 🐾\n\nOby kocie ścieżki zaprowadziły go kiedyś z powrotem. 💜`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                channel.send({ embeds: [leaveEmbed] }).catch(err => console.error("Błąd wysyłania pożegnania:", err));
            }
        }

        // =================================================================
        // KROK 2: AKTUALIZACJA STATYSTYK
        // =================================================================
        try {
            if (settings.memberCountChannelId) {
                const channel = member.guild.channels.cache.get(settings.memberCountChannelId);
                if (channel && !channel.name.includes(String(member.guild.memberCount))) {
                    await channel.setName(`┇👫🏻┇Członkowie: ${member.guild.memberCount}`);
                }
            }
        } catch (error) {
             // Ignorujemy błędy rate limit
        }
    },
};