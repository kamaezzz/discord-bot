const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    messageId: String,       // Po tym ID znajdziemy wiadomość do edycji
    prize: String,           // Nagroda
    endTime: Number,         // Czas zakończenia (w milisekundach)
    winnersCount: Number,    // Ilu zwycięzców
    hostId: String,          // Kto zorganizował
    participants: [String],  // Tablica z ID osób, które kliknęły
    ended: { type: Boolean, default: false }
});

module.exports = mongoose.model('Giveaway', giveawaySchema);