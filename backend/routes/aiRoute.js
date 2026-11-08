const express = require('express');
const router = express.Router();
const { getMovieRecommendation } = require('../controllers/aiCon');

router.post('/recommend', getMovieRecommendation);

module.exports = router;