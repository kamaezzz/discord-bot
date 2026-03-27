const axios = require('axios');

// ⚠️ WKLEJ TUTAJ KLUCZ (W cudzysłowie):
const apiKey = "RGAPI-aff160cb-7a58-44a4-8438-00553ddd3d1c"; 

// Dane, które wpisałeś w komendzie
const name = "always";
const tag = "91225";
const region = "americas"; // NA używa routingu "americas"

async function testRiotAccount() {
    console.log(`🔑 Testuję Account-V1 na regionie: ${region}`);
    
    // To jest dokładnie ten URL, na którym wywala się bot
    const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`;

    try {
        const response = await axios.get(url, {
            headers: { "X-Riot-Token": apiKey }
        });
        console.log("✅ SUKCES! Udało się pobrać dane konta.");
        console.log("PUUID:", response.data.puuid);
        console.log("Wniosek: Klucz i IP są w porządku. Problem jest w kodzie bota.");
    } catch (error) {
        console.log("❌ BŁĄD!");
        if (error.response) {
            console.log(`Kod błędu: ${error.response.status} (${error.response.statusText})`);
            if (error.response.status === 403) {
                console.log("👉 PRZYCZYNA: Riot blokuje Twój klucz lub IP hostingu na tym konkretnym endpoincie.");
                console.log("To częste na tanich VPSach. Status API działa, ale Account API jest bardziej chronione.");
            }
        } else {
            console.log(error.message);
        }
    }
}

testRiotAccount();