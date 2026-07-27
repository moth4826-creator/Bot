const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');

// Load config from environment variables (Railway) or config.json (local)
const config = {
    token: process.env.DISCORD_TOKEN || (fs.existsSync('./config.json') ? require('./config.json').token : ''),
    clientId: process.env.CLIENT_ID || (fs.existsSync('./config.json') ? require('./config.json').clientId : ''),
    guildId: process.env.GUILD_ID || (fs.existsSync('./config.json') ? require('./config.json').guildId : ''),
    requiredRoleName: process.env.REQUIRED_ROLE_NAME || 'oHBaBYILOVeITEMS',
    ticketCategoryId: process.env.TICKET_CATEGORY_ID || (fs.existsSync('./config.json') ? require('./config.json').ticketCategoryId : '')
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const commands = [
    {
        name: 'panel',
        description: 'Create the ticket panel (Admin only)'
    }
];

const rest = new REST({ version: '10' }).setToken(config.token);

client.once('ready', async () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'panel') {
            // Check if user has the required role
            const hasRole = interaction.member.roles.cache.some(role => role.name === config.requiredRoleName);
            
            if (!hasRole) {
                return interaction.reply({
                    content: '❌ You do not have permission to use this command. You need the **oHBaBYILOVeITEMS** role.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('Purchase What You Want!')
                .setDescription('Open a ticket to continue 🙂')
                .setColor('#FF0000');

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_type')
                        .setPlaceholder('Select a ticket type')
                        .addOptions([
                            {
                                label: 'Purchase',
                                description: 'Open a ticket to purchase items',
                                value: 'purchase'
                            }
                        ])
                );

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_type') {
            const selectedValue = interaction.values[0];
            
            if (selectedValue === 'purchase') {
                await createTicket(interaction);
            }
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'selling') {
            await showSellingInfo(interaction);
        } else if (interaction.customId === 'buying') {
            await interaction.reply({
                content: '📥 **Buying Section** - Please let us know what you\'re looking to buy!',
                ephemeral: true
            });
        } else if (interaction.customId === 'close_ticket') {
            await closeTicket(interaction);
        }
    }
});

async function createTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    
    // Check if user already has an open ticket
    const existingTicket = guild.channels.cache.find(
        channel => channel.name === `ticket-${member.user.username.toLowerCase()}` && channel.type === ChannelType.GuildText
    );

    if (existingTicket) {
        return interaction.reply({
            content: `❌ You already have an open ticket: ${existingTicket}`,
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // Find the role
        const staffRole = guild.roles.cache.find(role => role.name === config.requiredRoleName);
        
        if (!staffRole) {
            return interaction.editReply({
                content: '❌ Staff role not found! Please contact an administrator.',
                ephemeral: true
            });
        }

        // Create the ticket channel
        const ticketChannel = await guild.channels.create({
            name: `ticket-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: config.ticketCategoryId || null,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: staffRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages
                    ]
                }
            ]
        });

        // Create the ticket message
        const ticketEmbed = new EmbedBuilder()
            .setTitle('Purchase What You Want!')
            .setDescription('Please use the dropdown below to create a ticket based on your needs.')
            .setColor('#FF0000');

        const warningEmbed = new EmbedBuilder()
            .setDescription('Do **not** fall for scams. Staff will **never** DM you about tickets or bug reports. Do not respond to impersonators, and report any suspicious activity to staff immediately.')
            .setColor('#FF0000');

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buying')
                    .setLabel('Buying')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('selling')
                    .setLabel('Selling')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        await ticketChannel.send({
            content: `${member}`,
            embeds: [ticketEmbed, warningEmbed],
            components: [buttonRow]
        });

        await interaction.editReply({
            content: `✅ Ticket created! ${ticketChannel}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.editReply({
            content: '❌ An error occurred while creating the ticket. Please try again later.',
            ephemeral: true
        });
    }
}

async function showSellingInfo(interaction) {
    const discordEmbed = new EmbedBuilder()
        .setTitle('💬 Discord Items For Sale')
        .setDescription(
            '**Discord usernames:**\n\n' +
            '`@groundeds` - **OGE semi** (real word is "grounded")\n\n' +
            '`@camlockings` - **OGE semi** (cheater word "camlocking original word")\n\n' +
            '`@immorallys` - **OGE semi** (real word is "Imorally")\n\n' +
            '`@rehabs` - **OGE** c/o $450 (from dylan) | BIN: ?'
        )
        .setColor('#5865F2')
        .setTimestamp();

    const robloxEmbed = new EmbedBuilder()
        .setTitle('🎮 Roblox Items For Sale')
        .setDescription(
            '**Roblox usernames:**\n\n' +
            '`@90ga` - **NO OGE** (fully safe, warranty and contract in dms)\n\n' +
            '**Roblox accounts:**\n\n' +
            '`@SynHasBadAtomicSets` - **$69.50** (OGE provided I believe)\n\n' +
            '**Robux in stock:**\n\n' +
            '💰 **30k robux available** at **$4.50/1k** ($4.50 every 1k robux)\n' +
            '```\n' +
            '💳 CRYPTO / CRYPTO GIFTCARD ONLY\n' +
            'I DONT TAKE ANY OTHER PAYMENTS\n' +
            '(other payments soon)\n\n' +
            'Minimum buy: 5k robux\n' +
            'Must wait in group for 14 days to be eligible for payouts\n' +
            '```'
        )
        .setColor('#00D26A')
        .setTimestamp();

    await interaction.reply({
        embeds: [discordEmbed, robloxEmbed],
        ephemeral: true
    });
}

async function closeTicket(interaction) {
    const channel = interaction.channel;
    
    // Verify this is a ticket channel
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({
            content: '❌ This command can only be used in ticket channels.',
            ephemeral: true
        });
    }

    await interaction.reply({
        content: '🔒 Closing ticket in 5 seconds...'
    });

    setTimeout(async () => {
        try {
            await channel.delete();
        } catch (error) {
            console.error('Error deleting ticket channel:', error);
        }
    }, 5000);
}

client.login(config.token);
