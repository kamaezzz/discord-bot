const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valorant')
        .setDescription('Sprawdza statystyki gracza (Tylko mecze Rankingowe).')
        .addStringOption(option =>
            option.setName('nick')
                .setDescription('Nazwa gracza (np. Tenz)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Tag gracza bez hashtaga (np. 1234)')
                .setRequired(true)),

    async execute(interaction) {
        // ZMIANA TUTAJ: Usunąłem { flags: MessageFlags.Ephemeral }
        // Teraz deferReply() jest domyślnie publiczny.
        await interaction.deferReply();

        const name = interaction.options.getString('nick');
        const tag = interaction.options.getString('tag');
        
        const trackerUrl = `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(name)}%23${tag}/overview`;
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Zobacz pełne statystyki na Tracker.gg')
                .setStyle(ButtonStyle.Link)
                .setURL(trackerUrl)
                .setEmoji('📊')
        );

        const apiKey = process.env.VALORANT_API_KEY;

        // --- SAFE MODE ---
        if (!apiKey || apiKey === 'twoj_skopiowany_klucz_tutaj') {
            const maintenanceEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⚠️ Przerwa Techniczna API')
                .setDescription('Oczekiwanie na klucz API. Możesz sprawdzić profil ręcznie:')
                .setFooter({ text: 'Brak klucza API w .env' });
            return interaction.editReply({ embeds: [maintenanceEmbed], components: [row] });
        }
        // -----------------

        const region = 'eu'; 
        const config = { headers: { 'Authorization': apiKey } };

        try {
            const [mmrRes, accountRes, matchesRes] = await Promise.all([
                axios.get(`https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${name}/${tag}`, config),
                axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${name}/${tag}`, config),
                axios.get(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${name}/${tag}?size=15&filter=competitive`, config)
            ]);

            if (mmrRes.status !== 200 || accountRes.status !== 200) throw new Error('API Error');

            const mmr = mmrRes.data.data;
            const account = accountRes.data.data;
            const allMatches = matchesRes.data.data;

            let totalKills = 0;
            let totalDeaths = 0;
            let historyText = ""; 
            let gamesCount = 0;
            
            for (const match of allMatches) {
                if (match.metadata.mode !== 'Competitive') continue;
                if (gamesCount >= 5) break; 
                if (!match.metadata || !match.players) continue;

                const playerStats = match.players.all_players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase());
                
                if (playerStats) {
                    totalKills += playerStats.stats.kills;
                    totalDeaths += playerStats.stats.deaths;
                    gamesCount++;

                    const myTeam = playerStats.team ? playerStats.team.toLowerCase() : 'neutral';
                    let emoji = "❓";

                    if (match.teams && match.teams[myTeam]) {
                        if (match.teams[myTeam].has_won) emoji = "✅";
                        else if (match.teams[myTeam].rounds_won === match.teams[myTeam === 'blue' ? 'red' : 'blue'].rounds_won) emoji = "⚪";
                        else emoji = "❌";
                    }

                    const agent = playerStats.character || "Unknown";
                    const k = playerStats.stats.kills;
                    const d = playerStats.stats.deaths;
                    const a = playerStats.stats.assists;
                    const mapName = match.metadata.map || "Map";
                    
                    historyText += `${emoji} **${agent}** • \`${k}/${d}/${a}\` • ${mapName}\n`;
                }
            }

            if (gamesCount === 0) {
                historyText = "Brak ostatnich meczy rankingowych.";
            }

            const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills;

            const embed = new EmbedBuilder()
                .setColor('#9B59B6') 
                .setTitle(`Statystyki Rankingowe: ${account.name}#${account.tag}`)
                .setThumbnail(account.card.small)
                .addFields(
                    { name: '🏆 Ranga', value: `${mmr.currenttierpatched || 'Unranked'}`, inline: true },
                    { name: '📈 ELO (RR)', value: `${mmr.ranking_in_tier} / 100`, inline: true },
                    { name: '🆙 Poziom', value: `${account.account_level}`, inline: true },
                    { name: `🔫 Średnie K/D (Ostatnie ${gamesCount})`, value: `**${kdRatio}**`, inline: true },
                    { name: '📝 Ostatnie Mecze (Agent • K/D/A • Mapa)', value: historyText || 'Brak danych', inline: false }, 
                    { name: '📉 Ostatnia zmiana', value: `${mmr.mmr_change_to_last_game > 0 ? '+' : ''}${mmr.mmr_change_to_last_game} RR`, inline: true }
                )
                .setImage(account.card.wide)
                .setFooter({ text: '⚠️ Ranga może mieć opóźnienie | Tylko Rankedy | HenrikDev API' })
                .setTimestamp();

            if (mmr.images && mmr.images.large) embed.setThumbnail(mmr.images.large);

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Błąd Valorant:', error.message);
            let msg = '❌ Wystąpił błąd API.';
            if (error.response) {
                if (error.response.status === 404) msg = '❌ Nie znaleziono gracza. Sprawdź Nick i Tag.';
                else if (error.response.status === 401) msg = '❌ Błąd klucza API (Wygasł lub brak).';
                else if (error.response.status === 429) msg = '❌ Zbyt wiele zapytań. Odczekaj chwilę.';
            }
            await interaction.editReply({ content: `${msg}\nMożesz spróbować sprawdzić profil ręcznie:`, components: [row] });
        }
    },
};