const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const partnerRoleId = '1451179005733638207'; // Role Partner
const outputChannelId = '1451179603183009802'; // Kênh thông báo công khai
const staffChannelId = '1451179603183009802'; // Kênh staff (có thể đổi riêng nếu muốn)
const applyChannelId = '1451179603183009802'; // Kênh cố định để gửi đăng ký

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partner')
    .setDescription('Cấp role và gửi thông báo đối tác mới')
    .addUserOption(option =>
      option.setName('đại_diện')
        .setDescription('Người đại diện cho đối tác')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link mời đến server đối tác')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const user = interaction.options.getUser('đại_diện');
    const link = interaction.options.getString('link');
    const guild = interaction.guild;

    const messageContent = `>>> <a:RL_staff:1376216822197784587> **Đại Diện:** <@${user.id}>
<a:RL_ten:1376247271909232721> ${link}`;

    try {
      const channel = guild.channels.cache.get(outputChannelId);
      if (!channel) {
        return interaction.reply({ content: '❌ Không tìm thấy kênh gửi partner!', ephemeral: true });
      }

      await channel.send({ content: messageContent });

      const member = await guild.members.fetch(user.id);
      await member.roles.add(partnerRoleId);

      await user.send(
        `📩 Partner đã được hoàn tất!\nBạn đã được gán role đối tác tại server **${guild.name}**.\nCảm ơn bạn đã hợp tác cùng chúng tôi!`
      ).catch(() => console.log(`❗ Không thể gửi DM cho ${user.tag}.`));

      await interaction.reply({
        content: `✅ Đã cấp role partner cho ${user.tag} và gửi thông báo.`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Lỗi khi xử lý partner:', error);
      await interaction.reply({
        content: '❌ Đã xảy ra lỗi khi xử lý partner.',
        ephemeral: true
      });
    }
  },

  // ================== FORM ĐĂNG KÝ Ở KÊNH CỐ ĐỊNH ==================
  async handleMessage(message, client) {
    if (message.author.bot) return;
    if (message.channel.id !== applyChannelId) return;

    const user = message.author;

    try {
      // Hỏi link server
      await message.channel.send(`${user}, vui lòng gửi **link mời server** của bạn:`);
      const collected1 = await message.channel.awaitMessages({
        filter: m => m.author.id === user.id,
        max: 1,
        time: 60_000
      });
      if (!collected1.size) return message.channel.send("⏰ Hết thời gian trả lời.");
      const serverLink = collected1.first().content;

      // Hỏi số thành viên
      await message.channel.send(`Server của bạn hiện có **bao nhiêu thành viên**?`);
      const collected2 = await message.channel.awaitMessages({
        filter: m => m.author.id === user.id,
        max: 1,
        time: 60_000
      });
      if (!collected2.size) return message.channel.send("⏰ Hết thời gian trả lời.");
      const memberCount = collected2.first().content;

      // Gửi embed sang staff channel
      const embed = new EmbedBuilder()
        .setTitle("📩 Yêu cầu Partner mới")
        .addFields(
          { name: "Người đại diện", value: `<@${user.id}>`, inline: true },
          { name: "Server Link", value: serverLink, inline: false },
          { name: "Số thành viên", value: memberCount, inline: true }
        )
        .setColor("Blue")
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_${user.id}`)
          .setLabel("✅ Chấp nhận")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`deny_${user.id}`)
          .setLabel("❌ Từ chối")
          .setStyle(ButtonStyle.Danger)
      );

      const staffChannel = message.guild.channels.cache.get(staffChannelId);
      if (staffChannel) {
        await staffChannel.send({ embeds: [embed], components: [row] });
        await message.channel.send(`✅ Yêu cầu của bạn đã được gửi đến staff, vui lòng chờ duyệt.`);
      }

    } catch (err) {
      console.error("Lỗi khi tạo form partner:", err);
      message.channel.send("❌ Đã xảy ra lỗi khi xử lý yêu cầu.");
    }
  }
};
