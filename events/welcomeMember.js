const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

module.exports = (client) => {
  client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`[✅] Thành viên mới: ${member.user.tag}`);

    const channel = member.guild.channels.cache.find(
      ch => ch.name === 'welcome' || ch.id === '1444648369262821407'
    );
    if (!channel) {
      console.warn('[⚠️] Không tìm thấy kênh welcome.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff4757)
      .setTitle('<a:pink_bow:1444701287818989764> Welcome To Mango <a:pink_bow:1444701287818989764>')
      .setDescription(
        `Chúc bạn có những khoảng khắc vui vẻ và gắn kết với mọi người khi tham gia server, đừng ngần ngại trò chuyện và kết bạn với các thành viên khác nhé.\n\n` +
        `Hãy thoải mái tham gia các cuộc trò chuyện, đóng góp ý tưởng và cùng nhau xây dựng 1 cộng đồng vui vẻ và đoàn kết. ` +
        `Hi vọng bạn có những khoảng khắc tuyệt vời tại server!`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Mango • ${new Date().toLocaleTimeString()}`,
        iconURL: 'https://cdn.discordapp.com/attachments/1378063153027612884/1406730386905759906/913854ac485948c075b583f73908bbca.jpg?ex=68a38744&is=68a235c4&hm=bc91a610d16608df083e6372fba716676ba5badf8a460d0de9776eac773f9842&'
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('.gg/Mango')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/channels/1360197467261636750/1444648352905166849')
        .setEmoji('<a:RL_love:1444697294761889852>'),

      new ButtonBuilder()
        .setCustomId('greet_member')
        .setLabel('👋 Chào member')
        .setStyle(ButtonStyle.Primary)
    );

    let sentMessage;
    try {
      sentMessage = await channel.send({
        content: `🎉 Chào mừng <@${member.id}> đã đến với server, <@&1444648190681944087> có member mới nè!`,
        embeds: [embed],
        components: [row]
      });
    } catch (err) {
      console.error('[❌] Gửi tin nhắn welcome thất bại:', err);
      return;
    }

    const greetings = [
  `Hello người đẹp <@${member.id}>! Vào đây warm-up cùng tụi mình không? 🔫💖`,
  `Chào mừng <@${member.id}>! Hy vọng aim của bạn hôm nay không run như tim mình lúc thấy bạn 😳✨`,
  `Heyy <@${member.id}>! Vô server chơi nè—nhớ đừng bắn headshot tụi mình ngoài đời nha 😼💘`,
  `Ô kìa, tuyển thủ <@${member.id}> xuất hiện! Rank gì không biết nhưng nhìn là thấy đỉnh rồi 😎🔥`,
  `Welcome <@${member.id}>! Chúc bạn xinh đẹp như 1 pha Ace clutch 1v5 💫`,
  `<@${member.id}> vào rồi! Server hôm nay auto +5% accuracy 😳🌸`,
  `Wassup <@${member.id}>! Chúc bạn win streak đỏ map như đôi má bạn 😌❤️`,
  `Hello <@${member.id}>! Nói chuyện cho vui chứ đừng flash đồng đội như Phoenix nha 😭💗`,
  `<@${member.id}> đã đến! Mong bạn bắn chuẩn như cách bạn làm tim mình lệch nhịp 🔥💞`,
  `Chào mừng <@${member.id}>~ Luôn top frag cả trong game lẫn ngoài đời nha 😏✨`
    ];

    const collector = sentMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000 // 5 phút
    });

    collector.on('collect', async (interaction) => {
      console.log(`[🧪] Nút được bấm: ${interaction.customId} bởi ${interaction.user.tag}`);
      if (interaction.customId === 'greet_member') {
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        try {
          await interaction.reply({
            content: `<@${interaction.user.id}>: ${randomGreeting}`,
            ephemeral: false
          });
        } catch (err) {
          console.error('[❌] Không thể phản hồi interaction:', err);
        }
      }
    });

      collector.on('end', async () => {
  const disabledRow = new ActionRowBuilder().addComponents(
    row.components.map(button => {
      if (button.data?.custom_id === 'greet_member') {
        return ButtonBuilder.from(button).setDisabled(true); // chỉ disable nút chào
      }
      return button; // giữ nguyên nút link
    })
  );
  try {
    await sentMessage.edit({ components: [disabledRow] });
  } catch (err) {
    console.error('[❌] Không thể cập nhật message sau khi hết hạn:', err);
  }
  console.log('[🛑] Collector đã kết thúc và chỉ vô hiệu hoá nút greet_member.');
  });
});
};
