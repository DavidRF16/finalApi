const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { createOrder, getMyOrders, updateOrderStatus, getSellerOrders } = require('../controllers/order.controller');

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/seller-orders', getSellerOrders); 
router.put('/:id/status', updateOrderStatus);

module.exports = router;