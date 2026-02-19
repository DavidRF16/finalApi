const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  addFavorite,
  removeFavorite,
  getMyFavorites
} = require('../controllers/favorite.controller');

const router = express.Router();

router.use(protect);

router.post('/', addFavorite);
router.delete('/:productId', removeFavorite);
router.get('/my-favorites', getMyFavorites);

module.exports = router;