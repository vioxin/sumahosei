const { Client, GatewayIntentBits } = require('discord.js');
const nodemailer = require('nodemailer');
const express = require('express');

// ① Webサーバー設定 (GASで叩き起こすための受け
const app = express();
app.get('/', (req, res) => res.send('Bot is awake!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready.'));

// ② Discord Bot設定
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ③ メール送信設定 (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Bot用のGmailアドレス
        pass: process.env.GMAIL_PASS  // さっき取得した16桁のパスワード
    }
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// ④ Discordからメッセージが来たらメールを送る
client.on('messageCreate', async message => {
    // Bot自身の発言や、指定したチャンネル以外は無視
    if (message.author.bot) return;
    if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.MY_IPHONE_EMAIL, // あなたのiPhoneのメアド
        subject: `[Discord] ${message.author.username}`,
        text: message.content
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('メール送信成功！');
    } catch (error) {
        console.error('メール送信エラー:', error);
    }
});

// Botを起動！
client.login(process.env.DISCORD_TOKEN);
