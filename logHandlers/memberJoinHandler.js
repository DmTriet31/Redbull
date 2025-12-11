const { logsCollection } = require('../mongodb');
const WelcomeSettings = require('../models/welcome/WelcomeSettings');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Wcard } = require('wcard-gen');
const data = require('../UI/banners/welcomecards');
const createWelcomeDMEmbed = require('../data/welcome/welcomedmembed');
const InviteSettings = require('../models/inviteTracker/inviteSettings');
const Invite = require('../models/inviteTracker/invites');
const VerificationConfig = require('../models/gateVerification/verificationConfig');
const logHandlersIcons = require('../UI/icons/loghandlers');

/**
 * Helper Functions
 */
function getOrdinalSuffix(number) {
    if ([11, 12, 13].includes(number % 100)) return 'th';
    const lastDigit = number % 10;
    return ['st', 'nd', 'rd'][lastDigit - 1] || 'th';
}

function getRandomImage(images) {
    return images[Math.floor(Math.random() * images.length)];
}

function truncateUsername(username, maxLength = 15) {
    return username.length > maxLength ? `${username.slice(0, maxLength)}...` : username;
}

/**
 * Feature-specific handler functions
 */
async function handleVerification(member, verificationConfig) {
    try {
        if (!verificationConfig || !verificationConfig.verificationEnabled) return;
        
        const unverifiedRole = member.guild.roles.cache.get(verificationConfig.unverifiedRoleId);
        if (unverifiedRole) {
            await member.roles.add(unverifiedRole);
            console.log(`✅ Assigned Unverified role to ${member.user.tag}`);
        } else {
            console.log('❌ Unverified role not found.');
        }
    } catch (error) {
        console.error('❌ Error in verification handler:', error);
    }
}

async function handleInviteTracking(client, member) {
    try {
        const guild = member.guild;
        const settings = await InviteSettings.findOne({ guildId: guild.id });
        if (!settings || !settings.status) return;
        
        const newInvites = await guild.invites.fetch();
        const storedInvites = client.invites.get(guild.id) || new Map();
        
        const usedInvite = newInvites.find(inv => storedInvites.has(inv.code) && inv.uses > storedInvites.get(inv.code).uses);
        const inviterId = usedInvite ? usedInvite.inviter.id : null;
        
     
        client.invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, { inviterId: inv.inviter?.id || "Unknown", uses: inv.uses }])));
        
        
        if (inviterId && usedInvite) {
            await Invite.create({
                guildId: guild.id,
                inviterId,
                inviteCode: usedInvite.code,
                uses: usedInvite.uses
            });
        }
        
        
        if (settings.inviteLogChannelId) {
            const channel = guild.channels.cache.get(settings.inviteLogChannelId);
            if (channel) {
                let totalInvites = 0;
                if (inviterId) {
                    const inviteData = await Invite.find({ guildId: guild.id, inviterId });
                    totalInvites = inviteData.length + 1; 
                }
                
                const inviter = inviterId ? `<@${inviterId}>` : "Unknown";
                channel.send(`📩 **Nhật ký mời:** ${member} đã tham gia bằng lời mời từ ${inviter}. (**Tổng số lời mời: ${totalInvites}**)`);
            }
        }
        
        return { usedInvite, inviterId };
    } catch (error) {
        console.error("❌ Error tracking invite:", error);
        return { usedInvite: null, inviterId: null };
    }
}

async function handleMemberJoinLog(client, member) {
    try {
        const { user, guild } = member;
        const guildId = guild.id;
        
        const logConfig = await logsCollection.findOne({ guildId, eventType: 'memberJoin' });
        if (!logConfig?.channelId) return;
        
        const logChannel = client.channels.cache.get(logConfig.channelId);
        if (!logChannel) return;
        
        const logEmbed = new EmbedBuilder()
            .setTitle('🎉 Member Joined')
            .setColor('#00FF00')
            .addFields(
                { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Joined At', value: new Date().toLocaleString(), inline: true },
            )
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'Logs System', iconURL: logHandlersIcons.footerIcon })
            .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        console.error('❌ Error in member join log handler:', error);
    }
}

async function handleWelcomeChannel(member, welcomeSettings) {
    try {
        if (!welcomeSettings?.channelStatus || !welcomeSettings.welcomeChannelId) return;

        const welcomeChannel = member.guild.channels.cache.get(welcomeSettings.welcomeChannelId);
        if (!welcomeChannel) return;

        const user = member.user;
        const memberCount = member.guild.memberCount;
        const suffix = getOrdinalSuffix(memberCount);
        const username = truncateUsername(user.username, 15);
        const joinDate = member.joinedAt.toDateString();
        const creationDate = user.createdAt.toDateString();
        const serverIcon = member.guild.iconURL({ format: 'png', dynamic: true, size: 256 });

        const randomImage = getRandomImage(data.welcomeImages);
        const shortTitle = truncateUsername(`Welcome ${memberCount}${suffix}`, 15);

        const welcomecard = new Wcard()
            .setName(username) 
            .setAvatar(user.displayAvatarURL({ format: 'png' }))
            .setTitle(shortTitle)
            .setColor("00e5ff")
            .setBackground(randomImage);

        const cardBuffer = await welcomecard.build();
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });

const serverBannerURL = "https://cdn.discordapp.com/attachments/1406732260639510640/1406735073927106720/Mango.gif?ex=68a38ba1&is=68a23a21&hm=0c697269f7f454b6f9cbedc8f837cc9d7a3a0c8e6806777a5c414a0bc84637fd&";

const welcomeEmbed = new EmbedBuilder()
    .setTitle("୨ <:RL_Lounge_bow:1376217725994663957> ୧〃 ➜ *Thành viên mới*")
.setDescription(
  `*${member}* đã tham gia server! ﹒ ><a:pink_heart:1447004006248349756>`)
    .setColor(Math.floor(Math.random() * 16777215))
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setImage(serverBannerURL)
    .addFields(
        { name: 'Username', value: username, inline: true },
        { name: 'Join Date', value: joinDate, inline: true },
        { name: 'Account Created', value: creationDate, inline: true }
    )
.setFooter({
  text: `👤 Thành viên thứ ${memberCount}`,
    iconURL: serverIcon || "https://cdn.discordapp.com/attachments/1378063153027612884/1406730386905759906/913854ac485948c075b583f73908bbca.jpg?ex=68a38744&is=68a235c4&hm=bc91a610d16608df083e6372fba716676ba5badf8a460d0de9776eac773f9842&"
})
    .setTimestamp();

await welcomeChannel.send({
    embeds: [welcomeEmbed]
});


    } catch (error) {
        console.error('❌ Error in welcome channel handler:', error);
    }
}


function truncateUsername(name, maxLength = 15) {
    return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name;
}


async function handleWelcomeDM(member, welcomeSettings) {
    try {
        if (!welcomeSettings?.dmStatus) return;
        
        const dmEmbed = createWelcomeDMEmbed(member);
        await member.user.send({ embeds: [dmEmbed] });
    } catch (error) {
        console.warn(`❌ Failed to send DM to ${member.user.tag}:`, error.message);
    }
}

/**
 * Main Member Join Handler
 */
module.exports = async function memberJoinHandler(client) {
    client.on('guildMemberAdd', async (member) => {
        try {
            const guildId = member.guild.id;
            
            // Fetch all needed configuration in parallel to improve performance
            const [
                welcomeSettings, 
                verificationConfig
            ] = await Promise.all([
                WelcomeSettings.findOne({ serverId: guildId }),
                VerificationConfig.findOne({ guildId })
            ]);

 
            await Promise.allSettled([
            
                handleVerification(member, verificationConfig),
                
             
                handleInviteTracking(client, member),
                
             
                handleMemberJoinLog(client, member),
                
                
                handleWelcomeChannel(member, welcomeSettings),
                
                
                handleWelcomeDM(member, welcomeSettings)
            ]);
            
        } catch (error) {
            console.error('❌ Error in member join handler:', error);
        }
    });
};

