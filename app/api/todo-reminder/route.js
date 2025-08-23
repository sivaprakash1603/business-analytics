// app/api/todo-reminder/route.js
// Vercel Serverless Function for sending todo reminders


import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'business-analytics';
const EMAIL_API = process.env.EMAIL_API_URL ;



async function getTodosAndUsers() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const todos = await db.collection('todos').find({ completed: false }).toArray();
  const users = await db.collection('user').find({}).toArray();
  await client.close();
  // Map supabaseId to email for quick lookup
  const userEmailMap = {};
  users.forEach(user => {
    if (user.supabaseId && user.email) {
      userEmailMap[user.supabaseId] = user.email;
    }
  });
  console.log(`[DEBUG] Fetched ${todos.length} todos and ${users.length} users.`);
  return { todos, userEmailMap };
}


async function sendReminderEmail(to, subject, message) {
  console.log(`[DEBUG] Sending email to: ${to}, subject: ${subject}`);
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
  console.log('[DEBUG] /api/todo-reminder called');
  // Authorization check for Vercel Cron or GitHub Actions
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[DEBUG] Unauthorized request');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { todos, userEmailMap } = await getTodosAndUsers();
  for (const todo of todos) {
    console.log(`[DEBUG] Checking todo:`, {
      id: todo._id,
      title: todo.title,
      dueDate: todo.dueDate,
      dueTime: todo.dueTime,
      userId: todo.userId
    });
    const email = userEmailMap[todo.userId];
    if (!email) {
      console.log(`[DEBUG] No email found for userId: ${todo.userId}`);
      continue;
    }
    const oneDay = shouldSendReminder(todo.dueDate, todo.dueTime, 24 * 60 * 60 * 1000);
    const oneHour = shouldSendReminder(todo.dueDate, todo.dueTime, 60 * 60 * 1000);
    console.log(`[DEBUG] Reminder checks for todo '${todo.title}': 1 day=${oneDay}, 1 hour=${oneHour}`);
    // 1 day before
    if (oneDay) {
      console.log(`[DEBUG] Sending 1 day reminder for todo: ${todo.title} to ${email}`);
      await sendReminderEmail(
        email,
        `Reminder: '${todo.title}' is due in 1 day`,
        `Your task '${todo.title}' is due on ${todo.dueDate} at ${todo.dueTime}.`
      );
    }
    // 1 hour before
    if (oneHour) {
      console.log(`[DEBUG] Sending 1 hour reminder for todo: ${todo.title} to ${email}`);
      await sendReminderEmail(
        email,
        `Reminder: '${todo.title}' is due in 1 hour`,
        `Your task '${todo.title}' is due on ${todo.dueDate} at ${todo.dueTime}.`
      );
    }
  }
  console.log('[DEBUG] Reminder job finished');
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
