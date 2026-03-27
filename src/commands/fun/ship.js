const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Sprawdź dopasowanie miłosne między dwoma osobami! ❤️')
        .addUserOption(option =>
            option.setName('osoba1')
                .setDescription('Pierwsza osoba')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('osoba2')
                .setDescription('Druga osoba (opcjonalne, domyślnie Ty)')),

    async execute(interaction) {
        const user1 = interaction.options.getUser('osoba1');
        const user2 = interaction.options.getUser('osoba2') || interaction.user;

        // Prosty algorytm losujący % (zawsze ten sam dla tej samej pary w danym dniu można by zrobić, ale losowy jest zabawniejszy)
        const lovePercentage = Math.floor(Math.random() * 101);

        // Tworzenie paska postępu
        const heartFull = '❤️';
        const heartEmpty = '🖤';
        const totalHearts = 10;
        const fullHeartsCount = Math.round((lovePercentage / 100) * totalHearts);
        const emptyHeartsCount = totalHearts - fullHeartsCount;
        const progressBar = heartFull.repeat(fullHeartsCount) + heartEmpty.repeat(emptyHeartsCount);

        // Dobieranie komentarza i koloru
        let comment;
        let color;
        let image;

        if (lovePercentage > 90) {
            comment = "🔥 **IDEALNA PARA!** Planujcie wesele!";
            color = '#FF0000'; // Czerwony
            image = 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif';
        } else if (lovePercentage > 70) {
            comment = "💕 **Bardzo gorąco!** Jest chemia.";
            color = '#FF69B4'; // Różowy
        } else if (lovePercentage > 40) {
            comment = "😐 **Może coś z tego będzie...** ale trzeba popracować.";
            color = '#FFA500'; // Pomarańczowy
        } else {
            comment = "❄️ **Zimno...** Uciekaj póki możesz!";
            color = '#0000FF'; // Niebieski
            image = 'https://media.giphy.com/media/jUwpNzg9IcyrK/giphy.gif'; 
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('💘 Kalkulator Miłości')
            .setDescription(`Sprawdzamy dopasowanie:\n${user1} **+** ${user2}`)
            .addFields(
                { name: 'Wynik', value: `**${lovePercentage}%**`, inline: true },
                { name: 'Pasek', value: `${progressBar}`, inline: true },
                { name: 'Werdykt', value: comment, inline: false }
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2107/2107952.png')
            .setFooter({ text: 'Algorytm miłości' });

        if (image) embed.setImage(image);

        await interaction.reply({ embeds: [embed] });
    },
};