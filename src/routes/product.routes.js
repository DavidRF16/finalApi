const express = require('express');
const multer = require('multer');
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/product.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Públicas
router.get('/', getProducts);
router.get('/my-products', protect, getMyProducts); // ⚠️ DEBE ir antes de /:id
router.get('/:id', getProductById);

// Protegidas
router.post('/', protect, upload.single('image'), createProduct);
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;