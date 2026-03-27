const { Events, EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/Giveaway');
const TwitchStreamer = require('../models/TwitchStreamer');
const GuildSettings = require('../models/GuildSettings'); 
const axios = require('axios');
const cron = require('node-cron');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Zalogowano jako ${client.user.tag}`);
        
        client.user.setActivity('Oglądam ikskotixz 👀');

        // ====================================================
        // 1. HARMONOGRAM SKLEPU VALORANT (01:00)
        // ====================================================
        cron.schedule('0 1 * * *', async () => {
            const channelId = '1448788850230038651'; 
            const channel = client.channels.cache.get(channelId);

            if (channel) {
                console.log('⏰ Wysyłam przypomnienie o sklepie Valorant...');
                const shopEmbed = new EmbedBuilder()
                    .setColor('#FF4655')
                    .setTitle('🛒 Sklep Valorant Zaktualizowany!')
                    .setDescription('**Godzina 01:00 wybiła!** 🌙\nNowe skiny właśnie wjechały do Twojego sklepu.\n\n👉 Wejdź do gry i sprawdź, czy trafiłeś coś dobrego.\n\n> *Pamiętaj, skins = wins!*')
                    .setImage('https://cdn.dribbble.com/users/2340268/screenshots/15695678/media/17223b5f922650085a1a1cd469502949.jpg?compress=1&resize=800x600')
                    .setTimestamp()
                    .setFooter({ text: 'Automatyczne powiadomienie • Koteczek' });

                await channel.send({ embeds: [shopEmbed] });
            }
        }, {
            scheduled: true,
            timezone: "Europe/Warsaw"
        });

        // ====================================================
        // 2. SMART BUMP (Sprawdzanie co minutę)
        // ====================================================
        // Używamy setInterval co 60 sekund
        setInterval(async () => {
            const allSettings = await GuildSettings.find({ 'bumpSystem.enabled': true });
            const now = Date.now();

            for (const settings of allSettings) {
                // Jeśli czas na bump minął (nextBump < now) ORAZ jeszcze nie przypomnieliśmy
                if (settings.bumpSystem.nextBump > 0 && now >= settings.bumpSystem.nextBump && !settings.bumpSystem.reminded) {
                    
                    const guild = client.guilds.cache.get(settings.guildId);
                    if (!guild) continue;
                    
                    // Używamy kanału z bazy, A JEŚLI GO NIE MA, to używamy Twojego ID jako fallback
                    const channelId = settings.bumpSystem.channelId || '1448788850230038651';
                    
                    const channel = guild.channels.cache.get(channelId);
                    if (channel) {
                        const embed = new EmbedBuilder()
                            .setColor('#248046') // Zielony
                            .setTitle('🚀 CZAS NA BUMP!')
                            .setDescription('Minęły 2 godziny od ostatniego podbicia! Wpisz komendę:')
                            .addFields({ name: 'Komenda', value: '# **`/bump`**' })
                            .setFooter({ text: 'Bot przypomni ponownie dopiero jak podbijesz serwer!' });

                        // Wysyłamy wiadomość z pingiem @here
                        await channel.send({ content: '🔔 @here', embeds: [embed] });
                        
                        console.log(`✅ [BUMP] Wysłano przypomnienie na serwerze: ${guild.name}`);

                        // Zapisujemy, że przypomnienie zostało wysłane (żeby nie spamować co minutę)
                        settings.bumpSystem.reminded = true;
                        await settings.save();
                    } else {
                        console.log(`⚠️ [BUMP] Nie znaleziono kanału do przypomnień (ID: ${channelId})`);
                    }
                }
            }
        }, 60000); // 60000ms = 1 minuta

        // --- AUTH TWITCH ---
        let twitchAccessToken = null;
        const getTwitchToken = async () => {
            try {
                const response = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`);
                twitchAccessToken = response.data.access_token;
            } catch (error) { console.error('Błąd autoryzacji Twitch:', error.message); }
        };
        await getTwitchToken();

        // --- PĘTLA GIVEAWAY (10s) ---
        setInterval(async () => {
            const endedGiveaways = await Giveaway.find({ ended: false, endTime: { $lte: Date.now() } });
            for (const gw of endedGiveaways) {
                gw.ended = true;
                await gw.save();
                try {
                    const guild = client.guilds.cache.get(gw.guildId);
                    if (!guild) continue;
                    const channel = guild.channels.cache.get(gw.channelId);
                    if (!channel) continue;
                    const message = await channel.messages.fetch(gw.messageId).catch(() => null);
                    if (!message) continue;

                    if (gw.participants.length === 0) {
                        message.reply('❌ Konkurs zakończony. Nikt nie wziął udziału.');
                        continue;
                    }
                    const winners = [];
                    const participantsCopy = [...gw.participants];
                    const count = Math.min(gw.winnersCount, participantsCopy.length);
                    for (let i = 0; i < count; i++) {
                        const randomIndex = Math.floor(Math.random() * participantsCopy.length);
                        winners.push(participantsCopy[randomIndex]);
                        participantsCopy.splice(randomIndex, 1);
                    }
                    const winnersText = winners.map(id => `<@${id}>`).join(', ');
                    
                    const endEmbed = EmbedBuilder.from(message.embeds[0])
                        .setColor('#9B59B6') 
                        .setTitle('🎉 GIVEAWAY ZAKOŃCZONY 🎉')
                        .setDescription(`Nagroda: **${gw.prize}**\n\n🏆 Zwycięzcy: ${winnersText}\n👤 Organizator: <@${gw.hostId}>`);
                    
                    await message.edit({ embeds: [endEmbed], components: [] });
                    await channel.send(`🥳 Gratulacje ${winnersText}! Wygraliście: **${gw.prize}**!`);
                } catch (error) { console.error(error); }
            }
        }, 10000);

        // --- PĘTLA TWITCH (60s) ---
        setInterval(async () => {
            if (!twitchAccessToken) return;
            const allStreamers = await TwitchStreamer.find({});
            if (allStreamers.length === 0) return;
            const uniqueLogins = [...new Set(allStreamers.map(s => s.twitchLogin))];
            const chunks = [];
            while(uniqueLogins.length) chunks.push(uniqueLogins.splice(0, 100));

            for (const chunk of chunks) {
                const query = chunk.map(login => `user_login=${login}`).join('&');
                try {
                    const response = await axios.get(`https://api.twitch.tv/helix/streams?${query}`, {
                        headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${twitchAccessToken}` }
                    });
                    const liveStreams = response.data.data;

                    for (const dbStreamer of allStreamers) {
                        const streamData = liveStreams.find(s => s.user_login.toLowerCase() === dbStreamer.twitchLogin.toLowerCase());
                        if (streamData) {
                            if (!dbStreamer.isLive) {
                                const guild = client.guilds.cache.get(dbStreamer.guildId);
                                if (guild) {
                                    const channel = guild.channels.cache.get(dbStreamer.channelId);
                                    if (channel) {
                                        const streamUrl = `https://twitch.tv/${streamData.user_login}`;
                                        
                                        const embed = new EmbedBuilder()
                                            .setColor('#9146FF') 
                                            .setAuthor({ name: `${streamData.user_name} jest LIVE!`, iconURL: 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png' })
                                            .setTitle(streamData.title || 'Transmisja na żywo')
                                            .setURL(streamUrl)
                                            .addFields(
                                                { name: 'Gra', value: streamData.game_name || 'Inne', inline: true },
                                                { name: 'Widzów', value: `${streamData.viewer_count}`, inline: true }
                                            )
                                            .setImage(streamData.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
                                            .setTimestamp();

                                        const msgContent = `@everyone Serdecznie zapraszam misie pysie 💜\n\n${streamUrl}`;
                                        
                                        const sentMsg = await channel.send({ content: msgContent, embeds: [embed] });
                                        dbStreamer.lastMessageId = sentMsg.id;
                                    }
                                }
                                dbStreamer.isLive = true;
                                await dbStreamer.save();
                            }
                        } else {
                            if (dbStreamer.isLive) {
                                dbStreamer.isLive = false;
                                await dbStreamer.save();
                            }
                        }
                    }
                } catch (error) {
                    if (error.response && error.response.status === 401) await getTwitchToken();
                }
            }
        }, 60000);
    },
};