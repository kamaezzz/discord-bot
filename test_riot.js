const axios = require('axios');

// ⚠️ WKLEJ TUTAJ SWÓJ KLUCZ ZE STRONY RIOT (pomiędzy cudzysłowy):
const apiKey = "RGAPI-aff160cb-7a58-44a4-8438-00553ddd3d1c"; 

async function testRiot() {
    console.log(`🔑 Testuję klucz: ${apiKey}`);
    
    // Testujemy zapytanie o status serwera (nie wymaga żadnych ID, najprostszy test)
    const url = "https://eun1.api.riotgames.com/lol/status/v4/platform-data";

    try {
        const response = await axios.get(url, {
            headers: { "X-Riot-Token": apiKey }
        });
        console.log("✅ SUKCES! Klucz działa poprawnie.");
        console.log("Status serwera:", response.data.id);
    } catch (error) {
        console.log("❌ BŁĄD!");
        if (error.response) {
            console.log(`Kod błędu: ${error.response.status} (${error.response.statusText})`);
            if (error.response.status === 403) {
                console.log("👉 WNIOSEK: Ten klucz jest NIEPRAWIDŁOWY lub WYGASŁY.");
                console.log("1. Wejdź na developer.riotgames.com");
                console.log("2. Upewnij się, że nie ma komunikatu 'Expired'.");
                console.log("3. Skopiuj klucz ponownie.");
            }
        } else {
            console.log(error.message);
        }
    }
}

testRiot();