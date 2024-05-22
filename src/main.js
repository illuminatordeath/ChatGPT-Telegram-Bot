import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';
import config from 'config';

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));
const openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });

// Массив для хранения сообщений
let messages = [];

// Функция для экранирования специальных символов в тексте сообщения
function escapeMarkdownV2(text) {
    return text.replace(/[-.*+?^${}()|[\]\\!=_]/g, '\\$&');
}
// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
    messages.push({ role: 'user', content: ctx.message.text });
    if (messages.length > 6) {
        messages = messages.slice(-6);
    }
    try {
        // Потоковая передача ответов от OpenAI
        const stream = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            stream: true,
        });
        let replyMessage = ''; // Создаем переменную для хранения ответа

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                replyMessage += content; // Добавляем полученный кусок к общему ответу
            }
        }
        // Экранирование специальных символов в сообщении
        const escapedReplyMessage = escapeMarkdownV2(replyMessage);

        // Отправка общего ответа с разметкой MarkdownV2
        await ctx.reply(escapedReplyMessage, { parse_mode: 'MarkdownV2' });
        messages.push({ role: 'assistant', content: replyMessage }); // Добавление ответа в массив сообщений

    } catch (error) {
        console.error('Error:', error);
    }
});
bot.command('clear', (ctx) => {
    messages = []; // Очищаем массив сообщений
    ctx.reply('Контекст чата был успешно очищен.'); // Отправляем уведомление о том, что контекст чата очищен
});
// Установка списка команд бота
bot.telegram.setMyCommands([
    { command: 'clear', description: 'Очистить контекст чата' }
]);

// Запуск бота
bot.launch();