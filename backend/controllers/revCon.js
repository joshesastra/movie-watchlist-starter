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
      include: { movie: true },
      orderBy: { createdAt: 'desc' }
    });

    // Validasi super aman: Jika history kosong, langsung kembalikan array kosong dengan cepat
    if (!history || history.length === 0) {
      return res.status(200).json([]);
    }

    const formattedHistory = history.map(item => ({
      id: item.id,
      userId: item.userId,
      movieId: item.movieId,
      rating: item.rating,
      review: item.comment, 
      createdAt: item.createdAt,
      movie: item.movie
    }));

    return res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("ERROR GET WATCHED HISTORY:", error);
    return res.status(200).json([]); // Fallback aman agar frontend tidak crash/re-render otomatis
  }
};

const logWatchedMovie = async (req, res) => {
  try {
    const userId = req.user.userId;

    const movieIdRaw = req.body.movieId || req.body.id || (req.body.movie && req.body.movie.id);
    const { rating, comment, review } = req.body; // Menangkap deskripsi ulasan (bisa berupa properti comment atau review)

    const finalComment = comment || review;

    if (!movieIdRaw || !rating || !finalComment) {
      return res.status(400).json({ error: 'Data film, rating, dan teks ulasan wajib dikirim lengkap!' });
    }

    const movieId = parseInt(movieIdRaw);

    if (parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({ error: 'Rating harus berada di skala 1 sampai 5 bintang!' });
    }

    const newReview = await prisma.review.create({
      data: {
        userId,
        movieId,
        rating: parseInt(rating),
        comment: finalComment
      }
    });

    return res.status(201).json({ message: 'Riwayat ulasan berhasil dicatat!', data: newReview });
  } catch (error) {
    console.error("ERROR LOG WATCHED MOVIE:", error);
    return res.status(500).json({ error: 'Gagal mencatat ulasan film.' });
  }
};

module.exports = { getWatchedHistory, logWatchedMovie };