const { Events, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorujemy wiadomości spoza serwera
        if (!message.guild) return;

        // =================================================================
        // SYSTEM BUMP (DISBOARD) - ID: 302050872383242240
        // =================================================================
        if (message.author.id === '302050872383242240') {
            // Sprawdzamy czy wiadomość ma embed (Disboard zawsze wysyła embed)
            if (message.embeds.length > 0) {
                const embed = message.embeds[0];
                
                // Pobieramy treść z różnych miejsc (opis, tytuł), żeby mieć pewność
                const description = embed.description ? embed.description.toLowerCase() : "";
                const title = embed.title ? embed.title.toLowerCase() : "";

                // Słowa kluczowe: "bump done" (ang) lub "podbito" (pl)
                const isBumpSuccess = description.includes('bump done') || 
                                      description.includes('podbito') || 
                                      title.includes('podbito');

                if (isBumpSuccess) {
                    const settings = await GuildSettings.findOne({ guildId: message.guild.id });
                    
                    // Jeśli system jest włączony w bazie (lub włączymy go automatycznie przy wykryciu)
                    if (settings && settings.bumpSystem && settings.bumpSystem.enabled) {
                        
                        // Ustawiamy czas na: Teraz + 2 godziny (2 * 60 * 60 * 1000 ms)
                        settings.bumpSystem.nextBump = Date.now() + 7200000;
                        settings.bumpSystem.reminded = false; // Resetujemy flagę przypomnienia, żeby wysłał nowe
                        
                        await settings.save();

                        // Reakcja zegarka - potwierdzenie, że bot widzi bumpa
                        await message.react('⏰').catch(() => {}); 
                        console.log(`⏰ [BUMP] Wykryto podbicie na serwerze ${message.guild.name}. Timer ustawiony na 2h.`);
                    }
                }
            }
            return; // Kończymy obsługę wiadomości Disboarda
        }

        // --- RESZTA OBSŁUGI WIADOMOŚCI (DLA INNYCH UŻYTKOWNIKÓW) ---
        if (message.author.bot) return;

        const settings = await GuildSettings.findOne({ guildId: message.guild.id });
        if (!settings) return;

        // 0. BLOKADA KANAŁÓW (Valorant / LoL)
        if (settings.valorantChannelId && message.channel.id === settings.valorantChannelId) {
            try { await message.delete(); } catch (e) {} return;
        }
        if (settings.lolChannelId && message.channel.id === settings.lolChannelId) {
            try { await message.delete(); } catch (e) {} return;
        }

        // 1. ANTY-LINK
        if (settings.antilink) {
             const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)/i;
             if (inviteRegex.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                 try { await message.delete(); return; } catch (e) {}
             }
        }
        
        // 2. STREFA 4FUN
        const { fourFun } = settings;
        if (fourFun.countingChannelId && message.channel.id === fourFun.countingChannelId) {
             const userNumber = parseInt(message.content);
             if (userNumber !== fourFun.currentCount + 1) { try{await message.delete()}catch(e){}; return; }
             fourFun.currentCount++; fourFun.lastCountUser = message.author.id; await settings.save(); await message.react('✅'); return;
        }
        
        if (fourFun.lastLetterChannelId && message.channel.id === fourFun.lastLetterChannelId) {
            const content = message.cleanContent.trim();
            const cleanText = content.replace(/[^a-zA-ZplPLąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '');
            if (cleanText.length === 0) { await message.delete(); return; }

            const firstChar = cleanText.charAt(0).toLowerCase();
            if (fourFun.currentLastLetter && firstChar !== fourFun.currentLastLetter) {
                try { await message.delete(); } catch (e) {} return;
            }

            const words = content.split(/\s+/);
            const lastWord = words[words.length - 1];
            const cleanLastWord = lastWord.replace(/[^a-zA-ZplPLąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ''); 
            
            if (cleanLastWord.length === 0) { await message.delete(); return; }
            
            const lastChar = cleanLastWord.slice(-1).toLowerCase();
            fourFun.currentLastLetter = lastChar;
            await settings.save();
            await message.react('🔤');
            return;
        }

        if (fourFun.emojiChannelId && message.channel.id === fourFun.emojiChannelId) {
            let cleanContent = message.content.replace(/<a?:\w+:\d+>/g, '');
            cleanContent = cleanContent.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
            cleanContent = cleanContent.replace(/\s/g, '');
            if (cleanContent.length > 0) { try { await message.delete(); } catch (e) {} }
            return;
        }
    },
};