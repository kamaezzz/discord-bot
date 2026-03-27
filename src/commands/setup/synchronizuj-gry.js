const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('synchronizuj-gry')
        .setDescription('Pobiera ostatnie wiadomości z kanałów gier i aktualizuje stan bota.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
        
        if (!settings) {
            return interaction.editReply('❌ Baza danych nie jest skonfigurowana. Najpierw ustaw kanały gier.');
        }

        let log = "";
        let updated = false;

        // ==========================================
        // 1. SYNCHRONIZACJA LICZENIA
        // ==========================================
        if (settings.fourFun.countingChannelId) {
            const channel = interaction.guild.channels.cache.get(settings.fourFun.countingChannelId);
            if (channel) {
                // Pobierz 1 ostatnią wiadomość
                const messages = await channel.messages.fetch({ limit: 1 });
                const lastMsg = messages.first();

                if (lastMsg && !lastMsg.author.bot) {
                    const number = parseInt(lastMsg.content);
                    if (!isNaN(number)) {
                        settings.fourFun.currentCount = number;
                        settings.fourFun.lastCountUser = lastMsg.author.id;
                        log += `✅ **Liczenie:** Zaktualizowano na liczbę **${number}** (Użytkownik: ${lastMsg.author.tag})\n`;
                        updated = true;
                    } else {
                        log += `⚠️ **Liczenie:** Ostatnia wiadomość ("${lastMsg.content}") nie jest liczbą.\n`;
                    }
                } else {
                    log += `⚠️ **Liczenie:** Kanał jest pusty lub ostatnia wiadomość jest od bota.\n`;
                }
            } else {
                log += `❌ **Liczenie:** Nie znaleziono kanału (może został usunięty?).\n`;
            }
        }

        // ==========================================
        // 2. SYNCHRONIZACJA OSTATNIEJ LITERY
        // ==========================================
        if (settings.fourFun.lastLetterChannelId) {
            const channel = interaction.guild.channels.cache.get(settings.fourFun.lastLetterChannelId);
            if (channel) {
                const messages = await channel.messages.fetch({ limit: 1 });
                const lastMsg = messages.first();

                if (lastMsg && !lastMsg.author.bot) {
                    // Logika wyciągania ostatniej litery (taka sama jak w messageCreate)
                    const content = lastMsg.content.trim();
                    const words = content.split(/\s+/);
                    const lastWord = words[words.length - 1];
                    const cleanLastWord = lastWord.replace(/[^a-zA-ZplPLąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '');

                    if (cleanLastWord.length > 0) {
                        const lastChar = cleanLastWord.slice(-1).toLowerCase();
                        settings.fourFun.currentLastLetter = lastChar;
                        
                        log += `✅ **Litery:** Zaktualizowano. Ostatnie słowo: "${cleanLastWord}", wymagana litera: **"${lastChar.toUpperCase()}"**.\n`;
                        updated = true;
                    } else {
                        log += `⚠️ **Litery:** Ostatnia wiadomość nie zawiera poprawnych słów.\n`;
                    }
                } else {
                    log += `⚠️ **Litery:** Kanał jest pusty lub ostatnia wiadomość jest od bota.\n`;
                }
            } else {
                log += `❌ **Litery:** Nie znaleziono kanału.\n`;
            }
        }

        if (updated) {
            await settings.save();
            await interaction.editReply({ content: `🔄 **Wynik synchronizacji:**\n\n${log}` });
        } else {
            await interaction.editReply({ content: `ℹ️ **Brak zmian:**\n\n${log || "Nie skonfigurowano żadnych kanałów gier."}` });
        }
    },
};