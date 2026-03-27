const { Events, EmbedBuilder } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const settings = await GuildSettings.findOne({ guildId: member.guild.id });
        if (!settings) return;

        // =================================================================
        // KROK 1: NAJPIERW WYSYŁAMY POWITANIE (BŁYSKAWICZNIE)
        // =================================================================
        if (settings.welcomeChannelId) {
            const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
            if (channel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#9B59B6') // Fioletowy
                    .setTitle(`Witaj na serwerze!`)
                    .setDescription(`Halo halo ${member} Koteczku!\n\nDo serwera dołączył nowy członek kociej paczki. 💜 😸`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: `Jesteś ${member.guild.memberCount}. użytkownikiem` })
                    .setTimestamp();

                // Nie używamy tutaj 'await' w sposób blokujący resztę, 
                // ale catchujemy błąd, żeby nie wywaliło bota
                channel.send({ embeds: [welcomeEmbed] }).catch(err => console.error("Błąd wysyłania powitania:", err));
            }
        }

        // =================================================================
        // KROK 2: AKTUALIZACJA STATYSTYK (PO POWITANIU)
        // =================================================================
        // To wykonujemy na końcu, bo Discord może to opóźnić przez limity (Rate Limit)
        
        try {
            if (settings.memberCountChannelId) {
                const channel = member.guild.channels.cache.get(settings.memberCountChannelId);
                // Aktualizujemy tylko jeśli nazwa jest inna (oszczędza limity)
                if (channel && !channel.name.includes(String(member.guild.memberCount))) {
                     await channel.setName(`┇👫🏻┇Członkowie: ${member.guild.memberCount}`);
                }
            }
            if (settings.lastMemberChannelId) {
                const channel = member.guild.channels.cache.get(settings.lastMemberChannelId);
                if (channel) {
                     await channel.setName(`┇👋🏻┇ Nowy: ${member.user.username}`);
                }
            }
        } catch (error) {
            // Ignorujemy błędy rate limit (zbyt częstej zmiany nazwy), żeby nie śmiecić w logach
            // console.log("Opóźnienie aktualizacji statystyk (Rate Limit) - to normalne.");
        }
    },
};