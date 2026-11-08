const express = require('express');
const router = express.Router();
const { getWatchedHistory, logWatchedMovie } = require('../controllers/revCon');
const authenticateToken = require('../middleware/authMW');

router.use(authenticateToken);

router.get('/', getWatchedHistory);
router.post('/', logWatchedMovie);

module.exports = router;
