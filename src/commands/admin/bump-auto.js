const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump-auto')
        .setDescription('Ustawienia przypomnień o podbijaniu serwera (Bump).')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Włącz lub wyłącz przypomnienia')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Włącz (ON)', value: 'on' },
                    { name: '🔴 Wyłącz (OFF)', value: 'off' }
                ))
        .addChannelOption(option => 
            option.setName('kanal')
                .setDescription('Kanał, na którym bot ma przypominać o bumpie')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const status = interaction.options.getString('status');
        const channel = interaction.options.getChannel('kanal');

        let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
        if (!settings) {
            settings = new GuildSettings({ guildId: interaction.guild.id });
        }

        if (status === 'on') {
            // Jeśli włączamy, musimy mieć kanał (albo nowy z opcji, albo stary z bazy)
            if (!channel && !settings.bumpSystem.channelId) {
                return interaction.reply({ content: '❌ Aby włączyć, musisz podać kanał! Użyj opcji `kanal`.', ephemeral: true });
            }
            
            if (channel) {
                settings.bumpSystem.channelId = channel.id;
            }
            
            settings.bumpSystem.enabled = true;
            await settings.save();
            
            return interaction.reply(`✅ **Bump Reminder włączony!**\nBędę przypominał co 2 godziny na kanale <#${settings.bumpSystem.channelId}>.`);
        } else {
            // Wyłączanie
            settings.bumpSystem.enabled = false;
            await settings.save();
            return interaction.reply('🔴 **Bump Reminder wyłączony.**');
        }
    },
};