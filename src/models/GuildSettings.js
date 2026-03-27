const mongoose = require('mongoose');

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    
    // --- Moduły Administracyjne ---
    antilink: { type: Boolean, default: false },
    logChannelId: { type: String, default: null },
    welcomeChannelId: { type: String, default: null },
    leaveChannelId: { type: String, default: null },
    verifiedRoleId: { type: String, default: null },

    // --- Statystyki ---
    memberCountChannelId: { type: String, default: null },
    lastMemberChannelId: { type: String, default: null },

    // --- Strefa 4FUN ---
    fourFun: {
        countingChannelId: { type: String, default: null },
        currentCount: { type: Number, default: 0 },
        lastCountUser: { type: String, default: null },
        lastLetterChannelId: { type: String, default: null },
        currentLastLetter: { type: String, default: null },
        emojiChannelId: { type: String, default: null }
    },

    // --- Ticket System ---
    ticketSystem: {
        categoryId: { type: String, default: null },
        supportRoleId: { type: String, default: null },
        transcriptChannelId: { type: String, default: null },
        totalTickets: { type: Number, default: 0 }
    },

    // --- Dynamiczne Kanały ---
    dynamicVoice: {
        generatorChannelId: { type: String, default: null },
        categoryId: { type: String, default: null }
    },

    // --- Kanały Gier ---
    valorantChannelId: { type: String, default: null },
    lolChannelId: { type: String, default: null }, // <--- NOWE POLE

    // --- Kanał AI (Gemini) ---
    aiChannelId: { type: String, default: null },

    // --- SMART BUMP SYSTEM ---
    bumpSystem: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        nextBump: { type: Number, default: 0 },
        reminded: { type: Boolean, default: false }
    }
});

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);