const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating debe estar entre 1 y 5' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    // Lógica no trivial: solo puedes reseñar si tienes una orden completada
    const completedOrder = await Order.findOne({
      buyer: req.user.id,
      product: productId,
      status: 'completed'
    });

    if (!completedOrder) {
      return res.status(403).json({ success: false, message: 'Solo puedes reseñar productos que hayas comprado y completado' });
    }

    // Evitar reseñas duplicadas por usuario-producto
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Ya has reseñado este producto' });
    }

    const review = new Review({
      rating,
      comment,
      user: req.user.id,
      product: productId
    });

    await review.save();

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al crear reseña' });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener reseñas' });
  }
};