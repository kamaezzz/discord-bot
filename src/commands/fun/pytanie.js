const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pytanie')
        .setDescription('Zadaj pytanie Magicznej Kuli 🎱')
        .addStringOption(option =>
            option.setName('tresc')
                .setDescription('O co chcesz zapytać?')
                .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('tresc');
        
        // 1. Zamieniamy na małe litery
        // 2. Usuwamy spacje z początku i końca (.trim())
        // 3. Usuwamy znak zapytania z końca (jeśli jest), żeby zdanie było czyste do porównania
        const normalizedQuestion = question.toLowerCase().trim().replace(/\?+$/, '');

        // To jest dokładne zdanie, którego szukamy
        const secretTrigger = "czy krystian i kinga do siebie pasują i powinni być razem";

        let finalAnswer = null;

        // --- 🕵️‍♂️ UKRYTA FUNKCJA (EASTER EGG) ---
        // Sprawdzamy czy pytanie jest IDENTYCZNE jak secretTrigger
        if (normalizedQuestion === secretTrigger) {
            finalAnswer = {
                text: '🔥🔥 OOO TAK! Oni są dla siebie stworzeni!\nTo definicja gorącej miłości! Będzie ogień! 🛌❤️‍🔥',
                color: '#FF0000' // Gorąca czerwień
            };
        } else {
            // --- STANDARDOWE LOSOWANIE ---
            const answers = [
                // 🟢 POZYTYWNE
                { text: 'Zdecydowanie tak!', color: '#2ECC71' },
                { text: 'Bez wątpienia.', color: '#2ECC71' },
                { text: 'Możesz na to liczyć.', color: '#2ECC71' },
                { text: 'Gwiazdy mówią: Tak.', color: '#2ECC71' },
                { text: 'Wygląda to bardzo dobrze.', color: '#2ECC71' },
                
                // 🔴 NEGATYWNE
                { text: 'Nie licz na to.', color: '#E74C3C' },
                { text: 'Moja odpowiedź brzmi: Nie.', color: '#E74C3C' },
                { text: 'Bardzo wątpliwe.', color: '#E74C3C' },
                { text: 'Moje źródła mówią nie.', color: '#E74C3C' },
                { text: 'Zapomnij o tym.', color: '#E74C3C' },

                // 🟡 NEUTRALNE
                { text: 'Trudno powiedzieć...', color: '#F1C40F' },
                { text: 'Zapytaj ponownie później.', color: '#F1C40F' },
                { text: 'Lepiej ci teraz nie mówić.', color: '#95A5A6' },
                { text: 'Skoncentruj się i zapytaj jeszcze raz.', color: '#95A5A6' }
            ];

            finalAnswer = answers[Math.floor(Math.random() * answers.length)];
        }

        const embed = new EmbedBuilder()
            .setColor(finalAnswer.color)
            .setTitle('🎱 Magiczna Kula')
            .addFields(
                { name: '❓ Pytanie', value: question },
                { name: '💬 Odpowiedź', value: `**${finalAnswer.text}**` }
            )
            .setFooter({ text: `Wylosowano dla: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};