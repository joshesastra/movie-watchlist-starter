const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId; 

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: { 
        movie: true
      }
    });

    return res.status(200).json(watchlist);
  } catch (error) {
    console.error("ERROR GET WATCHLIST:", error);
    return res.status(500).json({ error: 'Gagal mengambil daftar watchlist dari server.' });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: 'ID Film wajib diisi!' });
    }

    const existingItem = await prisma.watchlist.findUnique({
      where: {
        userId_movieId: { 
          userId, 
          movieId: parseInt(movieId) 
        }
      }
    });

    if (existingItem) {
      return res.status(409).json({ error: 'Film ini sudah ada di dalam daftar watchlist Anda!' });
    }

    const newItem = await prisma.watchlist.create({
      data: {
        userId,
        movieId: parseInt(movieId)
      }
    });

    return res.status(201).json({ 
      message: 'Film berhasil ditambahkan ke daftar watchlist!', 
      data: newItem 
    });
  } catch (error) {
    console.error("ERROR ADD TO WATCHLIST:", error);
    return res.status(500).json({ error: 'Gagal menambahkan film ke watchlist.' });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Format ID film tidak valid!' });
    }

    await prisma.watchlist.delete({
      where: {
        userId_movieId: {
          userId,
          movieId
        }
      }
    });

    return res.status(200).json({ message: 'Film berhasil dihapus dari daftar watchlist Anda.' });
  } catch (error) {
    console.error("ERROR REMOVE FROM WATCHLIST:", error);
    return res.status(404).json({ error: 'Film gagal dihapus atau data film tidak ditemukan di watchlist Anda.' });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };