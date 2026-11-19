import dotenv from 'dotenv';
dotenv.config({ path: '/etc/prepapp/backend.env', quiet: true });
if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI key is not configured');
const response = await fetch('https://api.openai.com/v1/models', {
  headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error(`Provider connection failed (${response.status})`);
const models = await response.json();
if (!models.data.some(model => model.id === (process.env.OPENAI_TUTOR_MODEL || 'gpt-4.1-mini'))) throw new Error('Configured tutor model is unavailable');
console.log('PASS: server provider key and configured tutor model are available.');
