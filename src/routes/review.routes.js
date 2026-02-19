const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  createReview,
  getReviewsByProduct
} = require('../controllers/review.controller');

const router = express.Router();

router.get('/product/:productId', getReviewsByProduct);
router.post('/', protect, createReview);

module.exports = router;