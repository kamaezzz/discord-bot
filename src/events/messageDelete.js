const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Ignoruj wiadomości botów i wiadomości prywatne (DM)
        if (!message.guild || message.author?.bot) return;

        const settings = await GuildSettings.findOne({ guildId: message.guild.id });
        if (!settings || !settings.logChannelId) return;

        const logChannel = message.guild.channels.cache.get(settings.logChannelId);
        if (!logChannel) return;

        // --- KROK 1: KTO USUNĄŁ? (AUDIT LOGS) ---
        let executor = null;
        try {
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MessageDelete,
            });
            const deletionLog = fetchedLogs.entries.first();

            // Sprawdzamy czy log jest świeży (sprzed max 5 sekund) i dotyczy autora wiadomości
            // Jeśli nie ma logu, to znaczy, że użytkownik sam usunął swoją wiadomość
            if (deletionLog && deletionLog.target.id === message.author.id && deletionLog.createdTimestamp > (Date.now() - 5000)) {
                executor = deletionLog.executor;
            }
        } catch (e) {
            console.error("Błąd AuditLog:", e);
        }

        // Jeśli nie znaleziono sprawcy w logach, to na 99% autor usunął sam
        const deletedBy = executor ? executor : message.author;

        // --- KROK 2: OBRAZKI ---
        let imageURL = null;
        let attachmentsText = "";
        
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            // Sprawdzamy czy to obrazek
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                imageURL = attachment.proxyURL; // proxyURL jest trwalszy niż zwykły url po usunięciu
            }
            
            // Jeśli jest więcej plików, wylistuj linki
            if (message.attachments.size > 1 || !imageURL) {
                attachmentsText = "\n**Załączniki:**\n" + message.attachments.map(a => `[${a.name}](${a.proxyURL})`).join('\n');
            }
        }

        // --- KROK 3: EMBED ---
        const embed = new EmbedBuilder()
            .setColor('#FF4500') // Czerwony/Pomarańczowy
            .setTitle('🗑️ Usunięto wiadomość')
            .addFields(
                { name: '👤 Autor wiadomości', value: `${message.author} (\`${message.author.tag}\`)`, inline: true },
                { name: '🔨 Usunięte przez', value: `${deletedBy} (\`${deletedBy.tag}\`)`, inline: true },
                { name: '📍 Kanał', value: `${message.channel}`, inline: true },
                { name: '📄 Treść', value: message.content ? message.content : '*Brak treści tekstowej (tylko plik)*' }
            )
            .setTimestamp();

        if (attachmentsText) {
            embed.addFields({ name: '📎 Pliki', value: attachmentsText });
        }

        if (imageURL) {
            embed.setImage(imageURL);
            embed.setFooter({ text: 'Podgląd usuniętego zdjęcia' });
        }

        await logChannel.send({ embeds: [embed] });
    },
};