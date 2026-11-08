const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { GoogleGenAI } = require('@google/genai');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getMovieRecommendation = async (req, res) => {
  try {
    const { mood } = req.body;

    if (!mood) {
      return res.status(400).json({ error: 'Deskripsi mood wajib diisi!' });
    }

    const localMovies = await prisma.movie.findMany();

    const movieContext = localMovies.map(m => ({
      id: m.id,
      title: m.title,
      genres: m.genres,
      synopsis: m.synopsis
    }));

    const systemInstruction = `
      Kamu adalah pakar rekomendasi film profesional untuk platform Movie Watchlist.
      Tugas utama Kamu adalah memilih 1 (satu) film yang paling cocok dengan suasana hati (mood) yang diberikan oleh pengguna.
      
      ATURAN MUTLAK KETAT:
      1. Kamu hanya boleh memilih film dari daftar film lokal yang disediakan di bawah ini.
      2. Jangan pernah merekomendasikan film di luar daftar yang diberikan, meskipun film tersebut sangat terkenal.
      3. Jika mood pengguna tidak cocok dengan film apa pun, pilih satu film secara acak yang paling mendekati dari daftar.
      4. Kamu wajib mengembalikan respons hanya dalam format JSON mentah dengan struktur berikut tanpa teks pembuka/penutup markdown:
         {
           "movieId": <id_film_berupa_angka>,
           "reason": "<alasan_pemilihan_menggunakan_bahasa_indonesia_maksimal_3_kalimat>"
         }

      DAFTAR FILM LOKAL YANG TERSEDIA:
      ${JSON.stringify(movieContext, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Mood pengguna saat ini: "${mood}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const aiResult = JSON.parse(response.text.trim());

    const recommendedMovie = localMovies.find(m => m.id === aiResult.movieId);
    if (!recommendedMovie) {
      return res.status(500).json({ error: 'AI merekomendasikan ID film di luar database lokal.' });
    }

    return res.status(200).json({
      movie: recommendedMovie,
      reason: aiResult.reason
    });

  } catch (error) {
    console.error("ERROR GEMINI AI RECOMMENDATION:", error);
    return res.status(500).json({ error: 'Terjadi kegagalan pada sistem rekomendasi AI.' });
  }
};

module.exports = { getMovieRecommendation };