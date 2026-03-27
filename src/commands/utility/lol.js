const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lol')
        .setDescription('Sprawdza statystyki gracza (Ranga + Historia Meczy + KDA).')
        .addStringOption(option =>
            option.setName('nick')
                .setDescription('Riot ID (np. Agurin)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Tag (np. euw)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Region serwera')
                .setRequired(true)
                .addChoices(
                    { name: 'EUNE (Europa Północ/Wschód)', value: 'eun1' },
                    { name: 'EUW (Europa Zachód)', value: 'euw1' },
                    { name: 'NA (Ameryka Pn.)', value: 'na1' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const name = interaction.options.getString('nick');
        const tag = interaction.options.getString('tag');
        const region = interaction.options.getString('region');
        
        // --- KONFIGURACJA API (HEADER SPOOFING) ---
        const rawKey = process.env.RIOT_API_KEY;
        const apiKey = rawKey ? rawKey.trim() : null;

        if (!apiKey) {
            const errorEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('⚠️ Brak klucza API').setFooter({ text: 'Sprawdź plik .env' });
            return interaction.editReply({ embeds: [errorEmbed] });
        }

        const axiosConfig = {
            headers: { 
                "X-Riot-Token": apiKey,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        };

        const opggRegion = region === 'eun1' ? 'eune' : (region === 'euw1' ? 'euw' : 'na');
        const trackerUrl = `https://www.op.gg/summoners/${opggRegion}/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`;
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Zobacz na OP.GG')
                .setStyle(ButtonStyle.Link)
                .setURL(trackerUrl)
                .setEmoji('📊')
        );

        try {
            // 1. Routing (Region gry vs Region konta)
            let cluster = 'europe';
            if (region === 'na1') cluster = 'americas';

            // 2. Pobieranie PUUID (Konto)
            console.log(`[LOL] Pobieram PUUID: ${name}#${tag}`);
            const accountUrl = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`;
            const accountRes = await axios.get(accountUrl, axiosConfig);
            const { puuid, gameName, tagLine } = accountRes.data;

            // 3. Pobieranie Summoner ID (Ikonka, Level)
            console.log(`[LOL] Pobieram Summoner ID...`);
            const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
            const summonerRes = await axios.get(summonerUrl, axiosConfig);
            
            const summonerId = summonerRes.data.id;
            const profileIconId = summonerRes.data.profileIconId;
            const summonerLevel = summonerRes.data.summonerLevel;

            // 4. Pobieranie Rangi (Logika Hybrydowa)
            let leagueRes;
            try {
                if (summonerId) {
                    // Metoda klasyczna: przez ID
                    leagueRes = await axios.get(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`, axiosConfig);
                } else {
                    // Metoda awaryjna: przez PUUID (gdy brak ID)
                    leagueRes = await axios.get(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, axiosConfig);
                }
            } catch (e) {
                console.log('[LOL] Błąd pobierania ligi:', e.message);
                leagueRes = { data: [] }; // Traktuj jako Unranked
            }

            const soloQueue = leagueRes.data.find(q => q.queueType === 'RANKED_SOLO_5x5');
            let rankText = "Unranked";
            let lpText = "0 LP";
            
            if (soloQueue) {
                rankText = `${soloQueue.tier} ${soloQueue.rank}`;
                
                // POPRAWKA: Formatowanie LP dla rang wysokich (Master+) vs niskich
                const apexTiers = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
                if (apexTiers.includes(soloQueue.tier)) {
                    lpText = `**${soloQueue.leaguePoints} LP**`; // Np. 2174 LP
                } else {
                    lpText = `${soloQueue.leaguePoints} / 100 LP`; // Np. 45 / 100 LP
                }
            }

            // ==========================================================================================
            // 5. HISTORIA MECZÓW I KALKULACJA KDA
            // ==========================================================================================
            
            const matchesListUrl = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`;
            const matchesListRes = await axios.get(matchesListUrl, axiosConfig);
            const matchIds = matchesListRes.data;

            let totalKills = 0;
            let totalDeaths = 0;
            let totalAssists = 0;
            let historyText = "";
            let gamesCount = 0;

            const matchPromises = matchIds.map(matchId => 
                axios.get(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`, axiosConfig)
                    .catch(err => null)
            );

            const matchesDetails = await Promise.all(matchPromises);

            for (const matchRes of matchesDetails) {
                if (!matchRes || !matchRes.data) continue;
                
                const info = matchRes.data.info;
                const player = info.participants.find(p => p.puuid === puuid);

                if (player) {
                    gamesCount++;
                    totalKills += player.kills;
                    totalDeaths += player.deaths;
                    totalAssists += player.assists; // Zbieramy asysty do KDA

                    // Emoji
                    let emoji = "❓";
                    if (info.gameDuration < 300) emoji = "⚪"; // Remake
                    else if (player.win) emoji = "✅";
                    else emoji = "❌";

                    const champion = player.championName || "Unknown";
                    const k = player.kills;
                    const d = player.deaths;
                    const a = player.assists;
                    
                    // Tryb
                    let mode = info.gameMode; 
                    if (info.queueId === 420) mode = "Solo/Duo";
                    else if (info.queueId === 440) mode = "Flex";
                    else if (info.queueId === 450) mode = "ARAM";
                    else if (info.queueId >= 400 && info.queueId <= 430) mode = "Normal";

                    historyText += `${emoji} **${champion}** • \`${k}/${d}/${a}\` • ${mode}\n`;
                }
            }

            if (gamesCount === 0) {
                historyText = "Brak ostatnich meczów.";
            }

            // POPRAWKA: Wzór na KDA -> (K + A) / D
            let kdaRatio = totalKills + totalAssists; // Jeśli 0 śmierci, KDA to suma K+A
            if (totalDeaths > 0) {
                kdaRatio = ((totalKills + totalAssists) / totalDeaths).toFixed(2);
            }

            // ==========================================================================================
            // BUDOWANIE EMBEDA
            // ==========================================================================================

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(`Statystyki LoL: ${gameName}#${tagLine}`)
                .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${profileIconId}.png`)
                .addFields(
                    { name: '🏆 Ranga', value: rankText, inline: true },
                    { name: '📈 Punkty', value: lpText, inline: true },
                    { name: '🆙 Poziom', value: `${summonerLevel}`, inline: true },
                    // Zmieniona nazwa pola i wartość na nowe KDA
                    { name: `⚔️ Średnie KDA (Ostatnie ${gamesCount})`, value: `**${kdaRatio}**`, inline: true },
                    { name: '📝 Ostatnie Mecze (Postać • K/D/A • Tryb)', value: historyText || 'Brak danych', inline: false }
                )
                .setImage('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg') 
                .setFooter({ text: 'Riot Games API • Statystyki Solo/Duo' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Błąd LoL:', error.message);
            if (error.response) console.error('Status:', error.response.status);
            
            let msg = '❌ Wystąpił błąd API.';
            if (error.response) {
                if (error.response.status === 404) msg = '❌ Nie znaleziono gracza na tym serwerze.';
                else if (error.response.status === 403) msg = '❌ Błąd 403 (Forbidden).';
                else if (error.response.status === 429) msg = '❌ Za dużo zapytań (Rate Limit).';
            }
            
            await interaction.editReply({ content: `${msg}\nMożesz sprawdzić profil ręcznie:`, components: [row] });
        }
    },
};