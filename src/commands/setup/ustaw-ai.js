// const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
// const GuildSettings = require('../../models/GuildSettings');

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('ustaw-ai')
//         .setDescription('Ustawia kanał, na którym bot odpisuje na każdą wiadomość (AI Chat).')
//         .addChannelOption(option =>
//             option.setName('kanal')
//                 .setDescription('Wybierz kanał tekstowy')
//                 .addChannelTypes(ChannelType.GuildText)
//                 .setRequired(true))
//         .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

//     async execute(interaction) {
//         const channel = interaction.options.getChannel('kanal');

//         // findOneAndUpdate automatycznie NADPISUJE stary kanał nowym
//         await GuildSettings.findOneAndUpdate(
//             { guildId: interaction.guild.id },
//             { aiChannelId: channel.id }, // <--- To pole jest nadpisywane nowym ID
//             { upsert: true, new: true }
//         );

//         await interaction.reply({ 
//             content: `✅ **Skonfigurowano Czat AI!**\nNowy kanał rozmów: ${channel}\n(Poprzedni kanał został nadpisany)`,
//             flags: MessageFlags.Ephemeral 
//         });
//     },
// };