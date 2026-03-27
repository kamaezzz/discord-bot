const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const settings = await GuildSettings.findOne({ guildId: guild.id });
        if (!settings || !settings.logChannelId) return;

        const logChannel = guild.channels.cache.get(settings.logChannelId);
        if (!logChannel) return;

        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        // --- SCENARIUSZ: PRZENIESIENIE (MOVE) ---
        if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            
            // Czekamy 3 sekundy na Discorda
            await new Promise(res => setTimeout(res, 3000));

            let executor = null;
            
            try {
                const fetchedLogs = await guild.fetchAuditLogs({
                    limit: 5,
                    type: AuditLogEvent.MemberMove,
                });

                // Szukamy logu pasującego do tej sytuacji
                const moveLog = fetchedLogs.entries.find(entry => {
                    // Sprawdzamy, czy log jest świeży (max 10 sekund)
                    const isRecent = entry.createdTimestamp > (Date.now() - 10000);
                    
                    // METODA 1: Idealne dopasowanie ID (jeśli dostępne)
                    const isTargetMatch = entry.targetId === newState.member.id;

                    // METODA 2 (Awaryjna): Jeśli ID celu nie ma, ale log zrobił ktoś inny niż my
                    // (Log z xveezi, który widziałem u Ciebie, spełnia ten warunek)
                    const isSuspect = entry.executor && entry.executor.id !== newState.member.id;

                    return isRecent && (isTargetMatch || isSuspect);
                });

                // DIAGNOSTYKA W KONSOLI (Żebyś widział co złapał)
                if (moveLog) {
                    console.log(`[LOG] Znaleziono pasujący log! Sprawca: ${moveLog.executor.tag}, ID celu w logu: ${moveLog.targetId || 'BRAK'}`);
                    executor = moveLog.executor;
                } else {
                    console.log(`[LOG] Brak pasującego logu - uznano za samodzielne przejście.`);
                }

            } catch (e) {
                console.error("Błąd logów:", e);
            }

            const actionAuthor = executor ? `👮‍♂️ Przeniesiony przez: ${executor}` : `🦶 Przeszedł samodzielnie`;
            const color = executor ? '#FFA500' : '#3498DB'; 

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🔊 Zmiana kanału głosowego')
                .setDescription(`${newState.member} zmienił kanał głosowy.`)
                .addFields(
                    { name: '📤 Z kanału', value: oldChannel.name, inline: true },
                    { name: '📥 Na kanał', value: newChannel.name, inline: true },
                    { name: 'ℹ️ Akcja', value: actionAuthor, inline: false }
                )
                .setThumbnail(newState.member.user.displayAvatarURL())
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    },
};