const express = require('express');
const pool = require('./db');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Fungsi untuk mengirim email notifikasi menggunakan Brevo
const sendNotification = async (action, item) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.SENDER_EMAIL },
        to: [{ email: process.env.RECIPIENT_EMAIL }],
        subject: `CRUD Action: ${action}`,
        htmlContent: `<p>Aksi ${action} terjadi pada item: ${JSON.stringify(item)}</p>`,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Root Route
app.get('/', (req, res) => {
  res.send('Selamat datang di aplikasi CRUD! Silakan gunakan endpoint /items untuk operasi CRUD.');
});

// API Create
app.post('/items', async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required" });
  }
  const newItem = (await pool.query('INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *', [name, description])).rows[0];
  await sendNotification('CREATE', newItem);
  res.json(newItem);
});

// API Read
app.get('/items', async (req, res) => {
  const items = (await pool.query('SELECT * FROM items')).rows;
  res.json(items);
});

// API Update
app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required" });
  }
  const updatedItem = (await pool.query('UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *', [name, description, id])).rows[0];
  await sendNotification('UPDATE', updatedItem);
  res.json(updatedItem);
});

// API Delete
app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  const deletedItem = (await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id])).rows[0];
  await sendNotification('DELETE', deletedItem);
  res.json(deletedItem);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
