const mongoose = require('mongoose');

const twitchStreamerSchema = new mongoose.Schema({
    guildId: String,
    channelId: String,      // Gdzie wysłać powiadomienie
    twitchLogin: String,    // Nazwa streamera (np. "izakooo")
    isLive: { type: Boolean, default: false }, // Czy już wiemy, że jest live?
    lastMessageId: String   // ID ostatniego powiadomienia (opcjonalne, do czyszczenia)
});

module.exports = mongoose.model('TwitchStreamer', twitchStreamerSchema);