const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');

// Store active buying sessions
const buyingSessions = new Map();

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
    console.log(`📋 Config Check:`);
    console.log(`   - Client ID: ${config.clientId}`);
    console.log(`   - Guild ID: ${config.guildId}`);
    console.log(`   - Required Role: ${config.requiredRoleName}`);
    
    if (!config.clientId || !config.guildId) {
        console.error('❌ ERROR: CLIENT_ID or GUILD_ID is missing!');
        console.error('   Please check your Railway environment variables.');
        return;
    }
    
    try {
        console.log('Started refreshing application (/) commands.');
        console.log(`Registering ${commands.length} command(s) to guild ${config.guildId}...`);
        
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
        console.error('Full error details:', error.message);
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
            await startBuyingProcess(interaction);
        } else if (interaction.customId === 'confirm_purchase') {
            await showPaymentMethods(interaction);
        } else if (interaction.customId === 'cancel_purchase') {
            await cancelPurchase(interaction);
        } else if (interaction.customId === 'payment_crypto') {
            await showCryptoOptions(interaction);
        } else if (interaction.customId === 'sent_funds') {
            await confirmFundsSent(interaction);
        } else if (interaction.customId === 'close_ticket') {
            await closeTicket(interaction);
        }
    }
    
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'crypto_select') {
            await showCryptoAddress(interaction);
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

async function startBuyingProcess(interaction) {
    const buyEmbed = new EmbedBuilder()
        .setTitle('💰 What would you like to buy?')
        .setDescription('Please type what you want to purchase in the chat.')
        .setColor('#00D26A')
        .setTimestamp();

    await interaction.reply({
        embeds: [buyEmbed]
    });

    // Store the session
    buyingSessions.set(interaction.user.id, {
        channelId: interaction.channel.id,
        stage: 'waiting_for_item'
    });

    // Set up message collector
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ 
        filter, 
        time: 120000, // 2 minutes
        max: 1 
    });

    collector.on('collect', async (message) => {
        const session = buyingSessions.get(interaction.user.id);
        if (!session || session.stage !== 'waiting_for_item') return;

        // Store the item they want to buy
        session.item = message.content;
        session.stage = 'confirming';
        buyingSessions.set(interaction.user.id, session);

        // Show countdown and confirmation
        await showConfirmation(message.channel, interaction.user, message.content);
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            buyingSessions.delete(interaction.user.id);
        }
    });
}

async function showConfirmation(channel, user, item) {
    const countdownEmbed = new EmbedBuilder()
        .setTitle('⏳ Confirm Your Purchase')
        .setDescription(`**Item:** ${item}\n\nConfirming in: 3...`)
        .setColor('#FFA500')
        .setTimestamp();

    const countdownMsg = await channel.send({ embeds: [countdownEmbed] });

    // Store message ID in session
    const session = buyingSessions.get(user.id);
    if (session) {
        session.messageId = countdownMsg.id;
        buyingSessions.set(user.id, session);
    }

    // Countdown from 3
    for (let i = 2; i >= 1; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        countdownEmbed.setDescription(`**Item:** ${item}\n\nConfirming in: ${i}...`);
        await countdownMsg.edit({ embeds: [countdownEmbed] });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show confirm/cancel buttons
    const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Confirm Your Purchase')
        .setDescription(`**Item:** ${item}\n\nPlease confirm or cancel your purchase.`)
        .setColor('#00D26A')
        .setTimestamp();

    const confirmRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_purchase')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_purchase')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

    await countdownMsg.edit({ embeds: [confirmEmbed], components: [confirmRow] });
}

async function cancelPurchase(interaction) {
    const session = buyingSessions.get(interaction.user.id);
    
    // Check if this is the correct message
    if (!session || session.messageId !== interaction.message.id) {
        return interaction.reply({ 
            content: '❌ This purchase has already been processed or cancelled.', 
            ephemeral: true 
        });
    }

    buyingSessions.delete(interaction.user.id);

    const cancelEmbed = new EmbedBuilder()
        .setTitle('❌ Purchase Cancelled')
        .setDescription('Your purchase has been cancelled.')
        .setColor('#FF0000')
        .setTimestamp();

    await interaction.update({ embeds: [cancelEmbed], components: [] });
}

async function showPaymentMethods(interaction) {
    const session = buyingSessions.get(interaction.user.id);
    
    // Check if session exists and this is the correct message
    if (!session || session.messageId !== interaction.message.id) {
        return interaction.reply({ 
            content: '❌ This purchase has already been processed or cancelled.', 
            ephemeral: true 
        });
    }

    session.stage = 'payment_method';
    buyingSessions.set(interaction.user.id, session);

    const paymentEmbed = new EmbedBuilder()
        .setTitle('💳 Choose Your Payment Method')
        .setDescription(`**Item:** ${session.item}\n\nSelect your preferred payment method below.`)
        .setColor('#5865F2')
        .setTimestamp();

    const paymentRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('payment_crypto')
                .setLabel('Crypto')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [paymentEmbed], components: [paymentRow] });
}

async function showCryptoOptions(interaction) {
    const session = buyingSessions.get(interaction.user.id);
    
    // Check if session exists and this is the correct message
    if (!session || session.messageId !== interaction.message.id) {
        return interaction.reply({ 
            content: '❌ This purchase has already been processed or cancelled.', 
            ephemeral: true 
        });
    }

    session.stage = 'selecting_crypto';
    buyingSessions.set(interaction.user.id, session);

    const cryptoEmbed = new EmbedBuilder()
        .setTitle('₿ Select a Cryptocurrency')
        .setDescription('Choose your preferred cryptocurrency from the dropdown below.')
        .setColor('#F7931A')
        .setTimestamp();

    const cryptoSelect = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('crypto_select')
                .setPlaceholder('Select a cryptocurrency')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Solana (SOL)')
                        .setDescription('Pay with Solana')
                        .setValue('sol')
                        .setEmoji('◎'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Litecoin (LTC)')
                        .setDescription('Pay with Litecoin')
                        .setValue('ltc')
                        .setEmoji('Ł'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Ethereum (ETH)')
                        .setDescription('Pay with Ethereum')
                        .setValue('eth')
                        .setEmoji('Ξ')
                )
        );

    await interaction.update({ embeds: [cryptoEmbed], components: [cryptoSelect] });
}

async function showCryptoAddress(interaction) {
    const session = buyingSessions.get(interaction.user.id);
    
    // Check if session exists and this is the correct message
    if (!session || session.messageId !== interaction.message.id) {
        return interaction.reply({ 
            content: '❌ This purchase has already been processed or cancelled.', 
            ephemeral: true 
        });
    }

    const cryptoType = interaction.values[0];
    session.cryptoType = cryptoType;
    session.stage = 'showing_address';
    buyingSessions.set(interaction.user.id, session);

    // Define crypto addresses (you can change these to your real addresses)
    const cryptoAddresses = {
        sol: 'H6eFDS6Gwh2boPGjxYd8kffmmbTj2uZ5gEhL1j1eu3R8 ',
        ltc: 'LM9Z3kZft3bQwmRhXyZEQ7zfcZ2swJWExv',
        eth: '0x154221a1fB3F0Bf49Cde8E19c4201Fb69EcF352A '
    };

    const cryptoNames = {
        sol: 'Solana',
        ltc: 'Litecoin',
        eth: 'Ethereum'
    };

    const addressEmbed = new EmbedBuilder()
        .setTitle(`AutoPay ${cryptoNames[cryptoType]}`)
        .setDescription(
            `Only send funds to this ${cryptoNames[cryptoType]} address, once funds are sent they cannot be recovered if sent to the incorrect address.\n\n` +
            `**${cryptoNames[cryptoType]} Address**\n` +
            `\`${cryptoAddresses[cryptoType]}\`\n\n` +
            `Please send the exact amount as shown in the stock channel.`
        )
        .setColor('#FF0000')
        .setTimestamp();

    const sendFundsRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('sent_funds')
                .setLabel('Sent Funds')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.update({ embeds: [addressEmbed], components: [sendFundsRow] });
}

async function confirmFundsSent(interaction) {
    const session = buyingSessions.get(interaction.user.id);
    
    // Check if session exists and this is the correct message
    if (!session || session.messageId !== interaction.message.id) {
        return interaction.reply({ 
            content: '❌ This purchase has already been processed or cancelled.', 
            ephemeral: true 
        });
    }

    // Find the staff role
    const staffRole = interaction.guild.roles.cache.find(role => role.name === config.requiredRoleName);
    
    const waitingEmbed = new EmbedBuilder()
        .setTitle('⏳ Please Wait')
        .setDescription('Please wait for support to confirm your order.')
        .setColor('#FFA500')
        .setTimestamp();

    await interaction.update({ embeds: [waitingEmbed], components: [] });

    // Ping staff role
    const staffPingEmbed = new EmbedBuilder()
        .setTitle('🔔 New Order - Funds Sent')
        .setDescription(
            `**Customer:** ${interaction.user}\n` +
            `**Item:** ${session.item}\n` +
            `**Payment Method:** ${session.cryptoType?.toUpperCase() || 'Unknown'}\n` +
            `**Status:** Waiting for confirmation`
        )
        .setColor('#00D26A')
        .setTimestamp();

    if (staffRole) {
        await interaction.channel.send({
            content: `${staffRole}`,
            embeds: [staffPingEmbed]
        });
    } else {
        await interaction.channel.send({
            embeds: [staffPingEmbed]
        });
    }

    // Clean up session
    buyingSessions.delete(interaction.user.id);
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
