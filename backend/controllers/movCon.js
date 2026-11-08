const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getAllMovies = async (req, res) => {
  try {
    console.log("Mencoba mengambil data film dari cloud database...");
    
    let movies = await prisma.movie.findMany();

    if (req.query.shuffle === 'true') {
      movies = movies.sort(() => Math.random() - 0.5);
    }

    return res.status(200).json(movies);
  } catch (error) {
    console.error("ERROR:", error); 
    
    return res.status(500).json({ error: 'Gagal mengambil data film dari server.' });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);

    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Format ID film tidak valid!' });
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      return res.status(404).json({ error: 'Film tidak ditemukan!' });
    }

    return res.status(200).json(movie);
  } catch (error) {
    console.error("ERROR DETAIL FILM:", error);
    return res.status(500).json({ error: 'Gagal mengambil detail film dari server.' });
  }
};

module.exports = { getAllMovies, getMovieById };