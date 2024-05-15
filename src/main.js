import { Telegraf } from 'telegraf'
import OpenAI from 'openai'
import config from 'config'

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

const openai = new OpenAI ({apiKey: (config.get ("OPENAI_API_KEY") )})

let messages = [];

bot.on('text', async (ctx) => {
    messages.push({ role: 'user', content: ctx.message.text });
    if (messages.length > 6) {
        messages = messages.slice(-6);
    }
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
        });
        const replyMessage = response.choices[0].message.content;
        await ctx.reply(replyMessage);
        messages.push({ role: 'assistant', content: replyMessage });
    } catch (error) {
        console.error('Error:', error);
    }
});

bot.launch();