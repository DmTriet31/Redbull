const { SlashCommandBuilder } = require('@discordjs/builders');
const { 
    TextDisplayBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MediaGalleryBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách lệnh và thông tin bot')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Xem chi tiết một lệnh cụ thể')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const commands = this.getAllCommands();
        
        const filtered = commands
            .filter(cmd => cmd.name.toLowerCase().includes(focusedValue))
            .slice(0, 25)
            .map(cmd => ({
                name: `${cmd.name}${cmd.subcommands.length > 0 ? ` (${cmd.subcommands.length} lệnh phụ)` : ''}`.substring(0, 100),
                value: cmd.name
            }));

        await interaction.respond(filtered);
    },

    getAllCommands() {
        const allCommands = [];
        const COMMANDS_DIR = path.join(__dirname, '../../commands');
        const EXCESS_COMMANDS_DIR = path.join(__dirname, '../../excesscommands');

        const readCmds = (basePath, configSet) => {
            for (const [category, enabled] of Object.entries(configSet)) {
                if (!enabled) continue;
                const categoryPath = path.join(basePath, category);
                if (!fs.existsSync(categoryPath)) continue;

                fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => {
                        try {
                            const cmd = require(path.join(categoryPath, file));
                            const subcommands = this.extractSubcommands(cmd);
                            allCommands.push({
                                name: cmd.data?.name || cmd.name || 'unnamed',
                                description: (cmd.data?.description || cmd.description || 'Không có mô tả').substring(0, 100),
                                category,
                                subcommands,
                                type: basePath.includes('excesscommands') ? 'prefix' : 'slash'
                            });
                        } catch (err) {
                            console.error(`Lỗi khi load ${file}:`, err);
                        }
                    });
            }
        };

        readCmds(COMMANDS_DIR, config.categories);
        readCmds(EXCESS_COMMANDS_DIR, config.excessCommands);
        
        return allCommands;
    },

    extractSubcommands(cmd) {
        const subcommands = [];
        if (!cmd.data?.toJSON) return subcommands;

        const dataJSON = cmd.data.toJSON();
        if (!dataJSON.options || !Array.isArray(dataJSON.options)) return subcommands;

        for (const option of dataJSON.options) {
            if (option.type === 1) {
                subcommands.push({
                    name: option.name,
                    description: (option.description || 'Không có mô tả').substring(0, 80),
                    type: 'subcommand'
                });
            } else if (option.type === 2 && option.options) {
                const groupSubs = option.options
                    .filter(opt => opt.type === 1)
                    .map(opt => ({
                        name: `${option.name} ${opt.name}`,
                        description: (opt.description || 'Không có mô tả').substring(0, 80),
                        type: 'group'
                    }));
                subcommands.push(...groupSubs);
            }
        }
        return subcommands;
    },

    async execute(interaction) {
        await interaction.deferReply();

        const specificCommand = interaction.options.getString('command');

        if (specificCommand) {
            return this.showCommandDetails(interaction, specificCommand);
        }

        return this.showMainHelp(interaction);
    },

    async showCommandDetails(interaction, commandName) {
        const commands = this.getAllCommands();
        const cmd = commands.find(c => c.name.toLowerCase() === commandName.toLowerCase());

        if (!cmd) {
            const container = new ContainerBuilder().setAccentColor(0xff3860);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ❌ Không tìm thấy lệnh\n\n` +
                    `Lệnh \`${commandName}\` không tồn tại.\n` +
                    `Sử dụng \`/help\` để xem tất cả lệnh.`
                )
            );
            
            const navRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`help_back_main`)
                    .setLabel('Quay lại')
                    .setEmoji('🏠')
                    .setStyle(ButtonStyle.Primary)
            );
            
            return interaction.editReply({
                components: [container, navRow],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const CATEGORY_ICONS = this.getCategoryIcons();
        const categoryIcon = CATEGORY_ICONS[cmd.category.toLowerCase()] || "📁";
        const prefix = cmd.type === 'slash' ? '/' : config.prefix || '!';

        const displayComponents = [];

        // Header
        const headerContainer = new ContainerBuilder().setAccentColor(0x5865F2);
        headerContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${categoryIcon} \`${prefix}${cmd.name}\`\n\n${cmd.description}`
            )
        );
        displayComponents.push(headerContainer);
        displayComponents.push(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

        // Info
        const infoContainer = new ContainerBuilder().setAccentColor(0x5865F2);
        infoContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Danh mục:** ${cmd.category}\n**Loại:** ${cmd.type === 'slash' ? 'Slash Command' : 'Prefix Command'}\n**Số lệnh phụ:** ${cmd.subcommands.length}`
            )
        );
        displayComponents.push(infoContainer);

        // Subcommands
        if (cmd.subcommands.length > 0) {
            displayComponents.push(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
            const SUBS_PER_CONTAINER = 15;
            const totalContainers = Math.ceil(cmd.subcommands.length / SUBS_PER_CONTAINER);
            for (let i = 0; i < totalContainers; i++) {
                const start = i * SUBS_PER_CONTAINER;
                const end = Math.min(start + SUBS_PER_CONTAINER, cmd.subcommands.length);

                const subContainer = new ContainerBuilder().setAccentColor(0x667eea);
                let subText = `**Lệnh phụ (${start + 1}-${end} trên ${cmd.subcommands.length}):**\n\n`;
                cmd.subcommands.slice(start, end).forEach((sub, idx) => {
                    const globalIdx = start + idx + 1;
                    subText += `**${globalIdx}.** \`${sub.name}\`\n${sub.description}\n\n`;
                });
                subContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(subText.trim()));
                displayComponents.push(subContainer);
            }
        }

        // Footer
        displayComponents.push(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        const footerContainer = new ContainerBuilder().setAccentColor(0x95A5A6);
        footerContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `💡 **Mẹo:** Dùng \`${prefix}${cmd.name} <lệnh phụ>\` để thực thi lệnh phụ`
            )
        );
        displayComponents.push(footerContainer);

        const navRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`help_back_main`)
                .setLabel('Quay lại')
                .setEmoji('🏠')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setLabel('Hỗ trợ')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/xQF9f9yUEM')
        );

        const reply = await interaction.editReply({
            components: [...displayComponents, navRow],
            flags: MessageFlags.IsComponentsV2
        });

        this.setupCommandDetailsCollector(reply, interaction.user.id);
    },

    setupCommandDetailsCollector(message, userId) {
        const collector = message.createMessageComponentCollector({ 
            time: 300000,
            dispose: true 
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                return i.reply({ 
                    content: '⚠️ Chỉ người dùng khởi tạo lệnh mới có thể sử dụng menu này.', 
                    ephemeral: true 
                });
            }

            if (i.customId === 'help_back_main') {
                await i.deferUpdate();
                return this.showMainHelp(i);
            }
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    },

    async showMainHelp(interaction) {
        const COMMANDS_DIR = path.join(__dirname, '../../commands');
        const EXCESS_COMMANDS_DIR = path.join(__dirname, '../../excesscommands');
        
        const slashCommands = this.readCommands(COMMANDS_DIR, config.categories, 'slash');
        const prefixCommands = this.readCommands(EXCESS_COMMANDS_DIR, config.excessCommands, 'prefix');

        const chunkedPages = this.createChunkedPages(slashCommands, prefixCommands);

        const viewData = {
            currentPage: 0,
            currentMode: 'slash',
            slashCommands,
            prefixCommands,
            chunkedPages,
            userId: interaction.user.id
        };

        return this.renderHelpView(interaction, viewData);
    },

    readCommands(basePath, configSet, type) {
        const commandData = {};
        for (const [category, enabled] of Object.entries(configSet)) {
            if (!enabled) continue;
            const categoryPath = path.join(basePath, category);
            if (!fs.existsSync(categoryPath)) continue;

            const commands = fs.readdirSync(categoryPath)
                .filter(file => file.endsWith('.js'))
                .map(file => {
                    try {
                        const cmd = require(path.join(categoryPath, file));
                        const subcommands = this.extractSubcommands(cmd);
                        return {
                            name: cmd.data?.name || cmd.name || 'unnamed',
                            description: (cmd.data?.description || cmd.description || 'Không có mô tả').substring(0, 100),
                            subcommands,
                            type
                        };
                    } catch (error) {
                        console.error(`Lỗi khi load ${file}:`, error);
                        return null;
                    }
                })
                .filter(cmd => cmd !== null);

            if (commands.length > 0) {
                commandData[category] = commands;
            }
        }
        return commandData;
    },

    createChunkedPages(slashCommands, prefixCommands) {
        const pages = { slash: [], prefix: [] };
        const MAX_ITEMS_PER_PAGE = 60; 

        for (const mode of ['slash', 'prefix']) {
            const commandSet = mode === 'slash' ? slashCommands : prefixCommands;
            for (const category in commandSet) {
                const commands = commandSet[category];
                const chunks = [];
                let currentChunk = [];
                let currentItemCount = 0;
                let chunkIndex = 1;

                for (const cmd of commands) {
                    const cmdItemCount = 1 + cmd.subcommands.length; 
                    if (currentItemCount + cmdItemCount > MAX_ITEMS_PER_PAGE && currentChunk.length > 0) {
                        chunks.push({ commands: currentChunk, itemCount: currentItemCount, chunkIndex: chunkIndex++ });
                        currentChunk = [];
                        currentItemCount = 0;
                    }
                    currentChunk.push(cmd);
                    currentItemCount += cmdItemCount;
                }

                if (currentChunk.length > 0) {
                    chunks.push({ commands: currentChunk, itemCount: currentItemCount, chunkIndex: chunkIndex++ });
                }

                chunks.forEach((chunk, idx) => {
                    pages[mode].push({
                        category: category,
                        displayName: chunks.length > 1 ? `${category} (Phần ${idx + 1}/${chunks.length})` : category,
                        commands: chunk.commands,
                        itemCount: chunk.itemCount,
                        isChunked: chunks.length > 1,
                        chunkIndex: idx + 1,
                        totalChunks: chunks.length
                    });
                });
            }
        }

        return pages;
    },

    calculateStats(commandSet) {
        let masterCount = 0;
        let subCount = 0;
        for (const category in commandSet) {
            masterCount += commandSet[category].length;
            commandSet[category].forEach(cmd => { subCount += cmd.subcommands.length; });
        }
        return { masterCount, subCount, total: masterCount + subCount };
    },

    async renderHelpView(interaction, viewData, message = null) {
        const slashStats = this.calculateStats(viewData.slashCommands);
        const prefixStats = this.calculateStats(viewData.prefixCommands);
        const totalStats = { total: slashStats.total + prefixStats.total };

        const displayComponents = [];

        if (viewData.currentPage === 0) {
            const homeContainer = new ContainerBuilder().setAccentColor(0x667eea);
            homeContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ✨ Mango Bot\n\n` +
                    `Tổng cộng **${totalStats.total.toLocaleString()}+ lệnh**`
                )
            );
            displayComponents.push(homeContainer);
        } else {
            const pageIndex = viewData.currentPage - 1;
            const pages = viewData.chunkedPages[viewData.currentMode];
            if (pageIndex < pages.length) {
                const pageData = pages[pageIndex];
                const CATEGORY_ICONS = this.getCategoryIcons();
                const categoryIcon = CATEGORY_ICONS[pageData.category.toLowerCase()] || "📁";
                const prefix = viewData.currentMode === 'slash' ? '/' : config.prefix || '!';

                const headerContainer = new ContainerBuilder().setAccentColor(0x667eea);
                const headerText = pageData.isChunked 
                    ? `## ${categoryIcon} ${pageData.category} - Phần ${pageData.chunkIndex}/${pageData.totalChunks}\n\n` +
                      `**${pageData.commands.length}** lệnh • **${pageData.commands.reduce((acc, c) => acc + c.subcommands.length,0)}** lệnh phụ • **${pageData.itemCount}** mục`
                    : `## ${categoryIcon} ${pageData.category}\n\n` +
                      `**${pageData.commands.length}** lệnh • **${pageData.commands.reduce((acc, c) => acc + c.subcommands.length,0)}** lệnh phụ • **${pageData.itemCount}** mục`;

                headerContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
                displayComponents.push(headerContainer);

                let currentText = '';
                pageData.commands.forEach((cmd, cmdIdx) => {
                    let cmdText = `**${cmdIdx + 1}.** \`${prefix}${cmd.name}\`\n${cmd.description}`;
                    if (cmd.subcommands.length > 0) {
                        cmdText += `\n**└─ ${cmd.subcommands.length} lệnh phụ:**\n`;
                        cmd.subcommands.forEach((sub, subIdx) => {
                            cmdText += `\n   **${subIdx + 1}.** \`${sub.name}\`\n   ${sub.description}`;
                        });
                    }
                    currentText += cmdText + '\n\n';
                });

                const cmdContainer = new ContainerBuilder().setAccentColor(0x5865F2);
                cmdContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(currentText.trim()));
                displayComponents.push(cmdContainer);

                const footerContainer = new ContainerBuilder().setAccentColor(0x95A5A6);
                footerContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        pageData.isChunked 
                            ? `✅ Phần ${pageData.chunkIndex}/${pageData.totalChunks} • ${pageData.itemCount} mục hiển thị`
                            : `✅ Tất cả ${pageData.itemCount} mục hiển thị`
                    )
                );
                displayComponents.push(footerContainer);
            }
        }

        const interactionComponents = this.createHelpComponents(viewData);

        await this.sleep(100);

        if (message) {
            await message.edit({
                components: [...displayComponents, ...interactionComponents],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            const reply = await interaction.editReply({
                components: [...displayComponents, ...interactionComponents],
                flags: MessageFlags.IsComponentsV2
            });
            this.setupMainCollector(reply, viewData);
        }
    },

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

    createHelpComponents(viewData) {
        const pages = viewData.chunkedPages[viewData.currentMode];
        const totalPages = pages.length + 1;

        const selectOptions = [
            { label: 'Trang chủ', emoji: '🏠', value: 'page_0', description: 'Menu chính', default: viewData.currentPage === 0 }
        ];

        const CATEGORY_ICONS = this.getCategoryIcons();
        pages.slice(0, 24).forEach((pageData, idx) => {
            const icon = CATEGORY_ICONS[pageData.category.toLowerCase()] || "📁";
            const subCount = pageData.commands.reduce((acc, cmd) => acc + cmd.subcommands.length, 0);
            selectOptions.push({
                label: pageData.displayName.charAt(0).toUpperCase() + pageData.displayName.slice(1),
                value: `page_${idx + 1}`,
                description: `${pageData.commands.length} lệnh, ${subCount} lệnh phụ (${pageData.itemCount} mục)`,
                emoji: icon,
                default: viewData.currentPage === idx + 1
            });
        });

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`help_select`)
                .setPlaceholder('📋 Chọn danh mục hoặc phần...')
                .addOptions(selectOptions)
        );

        const navButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`help_prev`).setLabel('Trước').setEmoji('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(viewData.currentPage === 0),
            new ButtonBuilder().setCustomId(`help_home`).setLabel('Trang chủ').setEmoji('🏠').setStyle(ButtonStyle.Success).setDisabled(viewData.currentPage === 0),
            new ButtonBuilder().setCustomId(`help_next`).setLabel('Tiếp').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(viewData.currentPage === totalPages - 1),
            new ButtonBuilder().setCustomId(`help_mode`).setLabel(viewData.currentMode === 'slash' ? 'Chế độ Prefix' : 'Chế độ Slash').setEmoji('🔄').setStyle(ButtonStyle.Secondary)
        );

        const linkButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Hỗ trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/eKhkUgXcqU'),
            new ButtonBuilder().setLabel('GitHub').setStyle(ButtonStyle.Link).setURL('https://github.com/DmTriet31'),
            new ButtonBuilder().setLabel('Tài liệu').setStyle(ButtonStyle.Link).setURL('https://github.com/DmTriet31/Mango')
        );

        return [selectMenu, navButtons, linkButtons];
    },

    setupMainCollector(message, viewData) {
        const collector = message.createMessageComponentCollector({ time: 300000, dispose: true });

        collector.on('collect', async (i) => {
            if (i.user.id !== viewData.userId) {
                return i.reply({ content: '⚠️ Chỉ người dùng khởi tạo lệnh mới có thể sử dụng menu này.', ephemeral: true });
            }

            await i.deferUpdate();

            const pages = viewData.chunkedPages[viewData.currentMode];
            const totalPages = pages.length + 1;

            if (i.isStringSelectMenu() && i.customId === 'help_select') {
                viewData.currentPage = parseInt(i.values[0].split('_')[1]);
            } else if (i.isButton()) {
                switch (i.customId) {
                    case 'help_prev': viewData.currentPage = Math.max(0, viewData.currentPage - 1); break;
                    case 'help_home': viewData.currentPage = 0; break;
                    case 'help_next': viewData.currentPage = Math.min(totalPages - 1, viewData.currentPage + 1); break;
                    case 'help_mode': viewData.currentMode = viewData.currentMode === 'slash' ? 'prefix' : 'slash'; viewData.currentPage = 0; break;
                }
            }

            await this.sleep(150);
            await this.renderHelpView(i, viewData, i.message);
        });

        collector.on('end', () => { message.edit({ components: [] }).catch(() => {}); });
    },

    getCategoryIcons() {
        return {
            utility: "🛠️", moderation: "🛡️", fun: "🎮", music: "🎵", lavalink: "🎵",
            economy: "💰", admin: "⚙️", info: "ℹ️", games: "🎲",
            settings: "🔧", misc: "📦", general: "📋", entertainment: "🎪",
            social: "👥", tools: "🔨", automation: "🤖", logging: "📝",
            verification: "✅", leveling: "📈", tickets: "🎫", giveaway: "🎁",
            reaction: "😀", welcome: "👋", voice: "🔊", search: "🔎",
            image: "🖼️", meme: "😂", anime: "🎌", minigames: "🎯",
            gambling: "🎰", shop: "🏪", stats: "📊", leaderboard: "🏆", more: "🔍"
        };
    }
};
