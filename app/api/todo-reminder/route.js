// app/api/todo-reminder/route.js
// Vercel Serverless Function for sending todo reminders


import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'business-analytics';
const EMAIL_API ='/api/send-email';

async function getTodos() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const todos = await db.collection('todos').find({ completed: false }).toArray();
  await client.close();
  return todos;
}

async function getUserEmail(userId) {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const user = await db.collection('users').findOne({ uid: userId });
  await client.close();
  return user?.email;
}

async function sendReminderEmail(to, subject, message) {
  await fetch(EMAIL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html: `<p>${message}</p>`, text: message })
  });
}

function shouldSendReminder(dueDate, dueTime, offsetMs) {
  const due = new Date(`${dueDate}T${dueTime}`);
  const now = new Date();
  const reminderTime = new Date(due.getTime() - offsetMs);
  // Send if reminderTime is within the last 15 minutes
  return reminderTime > new Date(now.getTime() - 15 * 60 * 1000) && reminderTime <= now;
}

export async function GET(req) {
  // Authorization check for Vercel Cron
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const todos = await getTodos();
  for (const todo of todos) {
    // 1 day before
    if (shouldSendReminder(todo.dueDate, todo.dueTime, 24 * 60 * 60 * 1000)) {
      const email = await getUserEmail(todo.userId);
      if (email) {
        await sendReminderEmail(
          email,
          `Reminder: '${todo.title}' is due in 1 day`,
          `Your task '${todo.title}' is due on ${todo.dueDate} at ${todo.dueTime}.`
        );
      }
    }
    // 1 hour before
    if (shouldSendReminder(todo.dueDate, todo.dueTime, 60 * 60 * 1000)) {
      const email = await getUserEmail(todo.userId);
      if (email) {
        await sendReminderEmail(
          email,
          `Reminder: '${todo.title}' is due in 1 hour`,
          `Your task '${todo.title}' is due on ${todo.dueDate} at ${todo.dueTime}.`
        );
      }
    }
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
