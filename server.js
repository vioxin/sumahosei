const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// ① Webサーバー設定 (GASで叩き起こすための受け皿)
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

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// ③ Discordからメッセージが来たらGAS経由でメールを送る！
client.on('messageCreate', async message => {
    // Bot自身の発言や、指定したチャンネル以外は無視
    if (message.author.bot) return;
    if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

    // GASの抜け道へ渡す荷物（データ）を準備
    const payload = {
        to: process.env.MY_IPHONE_EMAIL, // あなたのiPhoneのメアド
        subject: `[Discord] ${message.author.username}`, // 件名
        body: message.content // メッセージ本文
    };

    try {
        // GASの魔法のURLに向かって荷物を投げる！
        const response = await fetch(process.env.GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.text();
        console.log('GASからの返事:', result); // 成功すれば Success! と出るはず
    } catch (error) {
        console.error('GAS通信エラー:', error);
    }
});

// Botを起動！
client.login(process.env.DISCORD_TOKEN);
