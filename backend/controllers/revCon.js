const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getWatchedHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const history = await prisma.review.findMany({
      where: { userId },
      include: {
        movie: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error("ERROR GET WATCHED HISTORY:", error);
    return res.status(500).json({ error: 'Gagal mengambil riwayat ulasan film dari server.' });
  }
};

const logWatchedMovie = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { movieId, rating, comment } = req.body;

    if (!movieId || !rating || !comment) {
      return res.status(400).json({ error: 'Data movieId, rating, dan ulasan wajib diisi!' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating hanya diperbolehkan skala 1 sampai 5 bintang!' });
    }

    const newReview = await prisma.review.create({
      data: {
        userId,
        movieId: parseInt(movieId),
        rating: parseInt(rating),
        comment
      }
    });

    return res.status(201).json({ 
      message: 'Riwayat tontonan dan ulasan film berhasil dicatat!', 
      data: newReview 
    });
  } catch (error) {
    console.error("ERROR LOG WATCHED MOVIE:", error);
    return res.status(500).json({ error: 'Gagal mencatat ulasan film ke server.' });
  }
};

module.exports = { getWatchedHistory, logWatchedMovie };