const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Usuwa określoną liczbę wiadomości z kanału.')
        .addStringOption(option =>
            option.setName('ilosc')
                .setDescription('Podaj liczbę (1-100) lub wpisz "all"')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Wymaga uprawnień do zarządzania wiadomościami

    async execute(interaction) {
        // Pobieramy wartość wpisaną przez użytkownika
        const input = interaction.options.getString('ilosc').toLowerCase();
        let amount;

        // Logika dla "all" lub liczby
        if (input === 'all') {
            amount = 100; // Limit Discorda dla jednej operacji to 100
        } else {
            amount = parseInt(input);
        }

        // Walidacja: czy to w ogóle liczba i czy mieści się w zakresie
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return interaction.reply({ 
                content: '❌ **Błąd:** Podaj liczbę od **1 do 100** lub wpisz **all**.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Odpowiadamy "w myślach" (defer), bo usuwanie może zająć chwilę
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // bulkDelete(ilość, true) -> 'true' oznacza, że filtrujemy wiadomości starsze niż 14 dni
            // (Discord API nie pozwala usuwać masowo wiadomości starszych niż 2 tygodnie)
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);

            // Odpowiedź końcowa
            await interaction.editReply({ 
                content: `🗑️ Pomyślnie usunięto **${deletedMessages.size}** wiadomości.` 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ 
                content: '❌ Wystąpił błąd podczas usuwania wiadomości. Pamiętaj, że nie mogę usuwać wiadomości starszych niż 14 dni.' 
            });
        }
    },
};