import { Telegraf, session } from 'telegraf';
import { OpenAI } from 'openai';
import config from 'config';

const bot = new Telegraf(config.TELEGRAM_TOKEN);
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// Максимальное количество сообщений для контекста
const MAX_MESSAGES = 6;

// Включаем сессию
bot.use(session()); 

// Функция для добавления сообщения в контекст
const addMessage = (ctx, role, content) => {
    // Проверяем, определен ли ctx.session
    if (!ctx.session) {
        ctx.session = {};
    }
    // Инициализируем messages, если оно отсутствует
    ctx.session.messages = ctx.session.messages || []; 
    ctx.session.messages.push({ role, content });
    if (ctx.session.messages.length > MAX_MESSAGES) {
        ctx.session.messages = ctx.session.messages.slice(-MAX_MESSAGES);
    }
};

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
    addMessage(ctx, 'user', ctx.message.text);
    try {
        const stream = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: ctx.session.messages,
            temperature: 0.7,
            stream: true,
        });
        let replyMessage = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                replyMessage += content;
            }
        }
        await ctx.reply(replyMessage);
        addMessage(ctx, 'assistant', replyMessage);
    } catch (error) {
        console.error('Error:', error);
        ctx.reply(`Произошла ошибка при обработке запроса: ${error.message}`);
    }
});

// Очистка контекста чата
bot.command('clear', async (ctx) => {
    // Проверяем, определен ли ctx.session
    if (ctx.session && ctx.session.messages) {
        delete ctx.session.messages; // Удаляем свойство messages из объекта сессии
        await ctx.session.save(); // Сохраняем изменения в сессии
    }
    // После очистки контекста сообщений, попробуем отправить сообщение
    ctx.reply('Контекст чата был успешно очищен.');
});

// Установка списка команд бота
bot.telegram.setMyCommands([
    { command: 'clear', description: 'Очистить контекст чата' }
]).catch((error) => {
    console.error('Error setting commands:', error);
});

// Запуск бота
bot.launch();
