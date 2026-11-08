require('dotenv').config(); 

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const externalMovies = require('../../data/movies.json');

async function main() {
  console.log('Mulai seeding data menggunakan ID asli dataset...');

  await prisma.movie.deleteMany();

  const formattedMovies = externalMovies.map((item) => ({
    id: item.id,
    title: item.title,
    year: item.year,
    director: item.director,
    genres: item.genres || [],
    rating: item.rating,
    duration: item.duration,
    synopsis: item.synopsis,
    poster_url: item.poster_url || null,
    cast: item.cast || []
  }));

  await prisma.movie.createMany({
    data: formattedMovies,
  });

  console.log(`Sukses! ${formattedMovies.length} film dengan ID dataset berhasil diupload.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });