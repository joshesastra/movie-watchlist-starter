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
    const finalMood = req.body.mood || req.body.query || req.body.description || req.body.vibe;

    if (!finalMood) {
      return res.status(400).json({ error: 'Deskripsi mood wajib diisi!' });
    }

    // 1. Tarik daftar 20 film lokal secara utuh dari database cloud Neon
    const localMovies = await prisma.movie.findMany();

    const movieContext = localMovies.map(m => ({
      id: m.id,
      title: m.title,
      genres: m.genres,
      synopsis: m.synopsis
    }));

    // 2. System Instruction ketat untuk Grounding
    const systemInstruction = `
      Anda adalah pakar rekomendasi film profesional untuk platform Movie Watchlist.
      Tugas utama Anda adalah memilih 1 (satu) film yang PALING COCOK dengan suasana hati (mood) yang diberikan oleh pengguna.
      
      ATURAN MUTLAK KETAT:
      1. Anda HANYA BOLEH memilih film dari DAFTAR FILM LOKAL yang disediakan di bawah ini.
      2. JANGAN PERNAH merekomendasikan film di luar daftar yang diberikan, meskipun film tersebut sangat terkenal.
      3. Jika mood pengguna tidak cocok dengan film apa pun, pilih satu film secara acak yang paling mendekati dari daftar.
      4. Anda WAJIB mengembalikan respons HANYA dalam format JSON mentah dengan struktur berikut tanpa teks pembuka/penutup markdown:
         {
           "movieId": <id_film_berupa_angka>,
           "reason": "<alasan_pemilihan_menggunakan_bahasa_indonesia_maksimal_3_kalimat>"
         }

      DAFTAR FILM LOKAL YANG TERSEDIA:
      ${JSON.stringify(movieContext, null, 2)}
    `;

    // 3. Kirim instruksi ke model Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Mood pengguna saat ini: "${finalMood}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    // 4. Ambil teks respons (Menangani variasi pembacaan teks di SDK terbaru)
    let aiText = response.text || (response.candidates && response.candidates[0].content.parts[0].text);
    
    if (!aiText) {
      throw new Error("Gemini tidak mengembalikan respons teks yang valid.");
    }

    // Bersihkan teks dari sisa-sisa markdown ```json jika ada
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const aiResult = JSON.parse(aiText);

    // 5. Validasi ulang & Konversi ID ke tipe Integer agar cocok dengan database Anda
    const targetId = parseInt(aiResult.movieId);
    const recommendedMovie = localMovies.find(m => m.id === targetId);
    
    if (!recommendedMovie) {
      // Jika AI salah memilih ID, kita berikan film nomor 1 sebagai fallback aman agar tidak crash
      return res.status(200).json({
        movie: localMovies[0],
        reason: aiResult.reason || "Film thriller yang cocok dengan suasana hati Anda."
      });
    }

    // 6. Kembalikan data lengkap film beserta alasan dari AI
    return res.status(200).json({
      movie: recommendedMovie,
      reason: aiResult.reason
    });

  } catch (error) {
    // Trik Debug Penting: Cetak error asli ke terminal VS Code agar Anda bisa melihat jika API Key salah/limit habis
    console.error("====== DETAIL ERROR ASLI GEMINI ======");
    console.error(error);
    console.error("======================================");
    
    return res.status(500).json({ error: 'Terjadi kegagalan pada sistem rekomendasi AI.' });
  }
};

module.exports = { getMovieRecommendation };