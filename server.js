const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// ---------- 【準備】Webサーバー（受け入れ窓口） ----------
const app = express();
// CloudMailinからの荷物（JSON）を開けるためのハサミ
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.send('Bot is awake!'));

// ---------- 【第2形態】スマホ(メール) ➔ Discord ----------
// CloudMailinがメールを受け取ると、ここのドアを猛ダッシュでノックします
app.post('/incoming-email', async (req, res) => {
    try {
        // メールの送信者と本文を抜き出す
        const fromEmail = req.body.envelope.from;
        const mailBody = req.body.plain || "本文なし";

        // Discordの指定チャンネルを探して発言！
        const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        await channel.send(mailBody.trim().substring(0, 2000));

        // CloudMailinに「無事受け取ったよ！」と返事（これがないとエラー扱いになる）
        res.status(200).send('OK');
    } catch (error) {
        console.error('受信エラー:', error);
        res.status(500).send('Error');
    }
});

// サーバー起動
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready.'));

// ---------- 【第1形態】Discord ➔ スマホ(メール) ----------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    // Bot自身の発言は無視する（無限ループ防止）
    if (message.author.bot) return;
    if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

    const payload = {
        to: process.env.MY_IPHONE_EMAIL,
        subject: `[Discord] ${message.author.username}`,
        body: message.content
    };

    try {
        const response = await fetch(process.env.GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.text();
        console.log('GASからの返事:', result);
    } catch (error) {
        console.error('GAS通信エラー:', error);
    }
});

// Botをログインさせる
client.login(process.env.DISCORD_TOKEN);
