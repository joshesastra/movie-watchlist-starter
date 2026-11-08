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

module.exports = { getWatchlist };