const { 
    Events, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, 
    ChannelType, UserSelectMenuBuilder 
} = require('discord.js');

const GuildSettings = require('../models/GuildSettings');
const Giveaway = require('../models/Giveaway');
const { voiceChannelOwners } = require('./voiceStateUpdate');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } 
            catch (error) { 
                const msg = { content: 'Wystąpił błąd!', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) await interaction.followUp(msg); else await interaction.reply(msg);
            }
        } 
        
        else if (interaction.isButton()) {
            // === A) KANAŁY PRYWATNE ===
            if (interaction.customId.startsWith('btn_vc_')) {
                let ownerId = voiceChannelOwners.get(interaction.channel.id);
                if (!ownerId) {
                    if (interaction.channel.permissionsFor(interaction.user).has(PermissionFlagsBits.ManageChannels)) {
                        ownerId = interaction.user.id;
                        voiceChannelOwners.set(interaction.channel.id, interaction.user.id);
                    }
                }
                if (ownerId !== interaction.user.id) return interaction.reply({ content: '❌ Nie jesteś właścicielem tego kanału!', flags: MessageFlags.Ephemeral });

                if (interaction.customId === 'btn_vc_delete') { await interaction.reply({ content: '🧨 Usuwanie...', ephemeral: true }); await interaction.channel.delete(); return; }

                if (interaction.customId === 'btn_vc_limit') {
                    const modal = new ModalBuilder().setCustomId('modal_vc_limit').setTitle('Ustaw limit osób');
                    const input = new TextInputBuilder().setCustomId('vc_limit_input').setLabel('Liczba (0 = brak)').setStyle(TextInputStyle.Short).setMaxLength(2).setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    await interaction.showModal(modal);
                    return;
                }

                if (interaction.customId === 'btn_vc_kick') {
                    const userSelect = new UserSelectMenuBuilder().setCustomId('select_vc_kick').setPlaceholder('Wybierz kogo wyrzucić').setMaxValues(1);
                    await interaction.reply({ content: 'Kogo wyrzucić?', components: [new ActionRowBuilder().addComponents(userSelect)], flags: MessageFlags.Ephemeral });
                    return;
                }
            }

            // === B) TICKET: ZAMKNIĘCIE (FIOLETOWY EMBED LOGÓW) ===
            if (interaction.customId === 'btn_close_ticket') {
                if (!interaction.channel.name.startsWith('ticket-')) return interaction.reply({ content: '❌ Błąd.', flags: MessageFlags.Ephemeral });
                await interaction.reply({ content: '⏳ Zamykanie...', ephemeral: true });
                
                const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
                if (settings?.ticketSystem.transcriptChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(settings.ticketSystem.transcriptChannelId);
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    const sortedMessages = messages.reverse();
                    let transcript = `Logi: ${interaction.channel.name}\nZamknął: ${interaction.user.tag}\n\n`;
                    sortedMessages.forEach(msg => transcript += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`);
                    const attachment = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: `${interaction.channel.name}.txt` });
                    
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#9B59B6') // FIOLETOWY
                            .setTitle('🗑️ Zgłoszenie Zamknięte')
                            .addFields({ name: 'Ticket', value: interaction.channel.name, inline: true }, { name: 'Zamknął', value: interaction.user.tag, inline: true })
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                    }
                }
                await interaction.channel.delete();
                return;
            }

            // === C) TICKET: OTWARCIE (MODAL) ===
            if (interaction.customId === 'btn_create_ticket') {
                const modal = new ModalBuilder().setCustomId('modal_ticket_create').setTitle('Stwórz zgłoszenie');
                const reasonInput = new TextInputBuilder().setCustomId('ticket_reason').setLabel("Powód zgłoszenia").setStyle(TextInputStyle.Paragraph).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
                return;
            }

            // === D) AUTO-ROLE ===
            if (interaction.customId.startsWith('autorole_')) {
                const roleId = interaction.customId.split('_')[1];
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) return interaction.reply({ content: '❌ Rola nie istnieje.', flags: MessageFlags.Ephemeral });
                const hasRole = interaction.member.roles.cache.has(roleId);
                try {
                    if (hasRole) { await interaction.member.roles.remove(role); await interaction.reply({ content: `➖ Odebrano rolę **${role.name}**.`, flags: MessageFlags.Ephemeral }); } 
                    else { await interaction.member.roles.add(role); await interaction.reply({ content: `➕ Nadano rolę **${role.name}**.`, flags: MessageFlags.Ephemeral }); }
                } catch (e) { await interaction.reply({ content: '❌ Błąd uprawnień.', flags: MessageFlags.Ephemeral }); }
                return;
            }
            
            // === E) WERYFIKACJA ===
            if (interaction.customId === 'btn_weryfikacja') {
                const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
                if (settings?.verifiedRoleId) {
                    const role = interaction.guild.roles.cache.get(settings.verifiedRoleId);
                    try { 
                        if (!role) return interaction.reply({content: 'Błąd roli', flags: MessageFlags.Ephemeral});
                        if (interaction.member.roles.cache.has(role.id)) return interaction.reply({content: 'Już masz tę rolę!', flags: MessageFlags.Ephemeral});
                        await interaction.member.roles.add(role); 
                        await interaction.reply({ content: '✅ Zweryfikowano pomyślnie!', flags: MessageFlags.Ephemeral }); 
                    } catch(e){ await interaction.reply({ content: '❌ Błąd uprawnień.', flags: MessageFlags.Ephemeral }); }
                }
            }
            // === F) GIVEAWAY ===
            if (interaction.customId === 'btn_giveaway_join') {
                const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
                if (!giveaway || giveaway.ended) return interaction.reply({ content: '❌ Koniec.', flags: MessageFlags.Ephemeral });
                const uid = interaction.user.id;
                if (giveaway.participants.includes(uid)) giveaway.participants = giveaway.participants.filter(id => id !== uid); else giveaway.participants.push(uid);
                await giveaway.save();
                const btn = new ButtonBuilder().setCustomId('btn_giveaway_join').setLabel(`Dołącz (${giveaway.participants.length})`).setEmoji('🎉').setStyle(ButtonStyle.Primary);
                await interaction.update({ components: [new ActionRowBuilder().addComponents(btn)] });
            }
        }

        else if (interaction.isModalSubmit()) {
            // VOICE LIMIT
            if (interaction.customId === 'modal_vc_limit') {
                const limit = parseInt(interaction.fields.getTextInputValue('vc_limit_input'));
                if (isNaN(limit) || limit < 0 || limit > 99) return interaction.reply({ content: '❌ Błąd.', flags: MessageFlags.Ephemeral });
                await interaction.channel.setUserLimit(limit);
                await interaction.reply({ content: `✅ Limit: **${limit}**`, flags: MessageFlags.Ephemeral });
            }

            // TICKET CREATE (FIOLETOWY EMBED)
            if (interaction.customId === 'modal_ticket_create') {
                const reason = interaction.fields.getTextInputValue('ticket_reason');
                const settings = await GuildSettings.findOneAndUpdate({ guildId: interaction.guild.id }, { $inc: { 'ticketSystem.totalTickets': 1 } }, { new: true });
                if (!settings?.ticketSystem.categoryId) return interaction.reply({ content: '❌ Błąd configu.', flags: MessageFlags.Ephemeral });
                
                const chName = `ticket-${String(settings.ticketSystem.totalTickets).padStart(4, '0')}`;
                const ch = await interaction.guild.channels.create({
                    name: chName, type: ChannelType.GuildText, parent: settings.ticketSystem.categoryId,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: settings.ticketSystem.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ]
                });
                // FIOLETOWY EMBED W ŚRODKU TICKETA
                const embed = new EmbedBuilder().setColor('#9B59B6').setTitle(`Zgłoszenie`).setDescription(`Powód: ${reason}`);
                const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_close_ticket').setLabel('Zamknij').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
                await ch.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `✅ Stworzono: ${ch}`, flags: MessageFlags.Ephemeral });
            }
        }

        else if (interaction.isUserSelectMenu()) {
            if (interaction.customId === 'select_vc_kick') {
                const targetUserId = interaction.values[0];
                const targetMember = await interaction.guild.members.fetch(targetUserId);
                if (!targetMember.voice.channel || targetMember.voice.channel.id !== interaction.channel.id) return interaction.reply({ content: '❌ Błąd.', flags: MessageFlags.Ephemeral });
                await targetMember.voice.disconnect(`Wyrzucony`);
                await interaction.reply({ content: `👢 Wyrzucono **${targetMember.user.tag}**.`, flags: MessageFlags.Ephemeral });
            }
        }
    },
};