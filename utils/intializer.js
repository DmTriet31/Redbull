const colors = require('../UI/colors/colors'); 
const client = require('../main');

function printBox({ title, lines, color = colors.cyan }) {
    console.log('\n' + '─'.repeat(60));
    console.log(`${color}${colors.bright}${title}${colors.reset}`);
    console.log('─'.repeat(60));
    lines.forEach(line => {
        console.log(`${color}${line}${colors.reset}`);
    });
    console.log('─'.repeat(60) + '\n');
}

async function initializeBot() {
    const BOT_ID = client.user?.id || 'AIO @1.4.1.0';

    // Thay vì check BOT_API / DISCORD_USER_ID, chỉ hiển thị thông báo
    printBox({
        title: '[ ✅ Bot Initialization Skipped Verification ]',
        lines: [
            `Bot ID: ${BOT_ID}`,
            'Skipped API verification.',
            'Bot is ready to go!'
        ],
        color: colors.green
    });

    return true;
}

module.exports = initializeBot;
