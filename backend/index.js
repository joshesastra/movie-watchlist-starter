require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors({
    origin: "*",
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const authRoutes = require('./routes/authRoute');
app.use('/api/auth', authRoutes);

const movieRoutes = require('./routes/movRoute');
app.use('/api/movies', movieRoutes);

const watchlistRoutes = require('./routes/wlRoute');
app.use('/api/watchlist', watchlistRoutes);

const reviewRoutes = require('./routes/revRoute');
app.use('/api/watched', reviewRoutes);

const aiRoutes = require('./routes/aiRoute');
app.use('/api/movies', aiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Movie Watchlist API Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`Server Backend berhasil menyala di http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

module.exports = { prisma };