const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/email');

exports.createOrder = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes comprar tu propio producto' });
    }
    if (product.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Este producto no está disponible' });
    }

    const existingOrder = await Order.findOne({
      buyer: req.user.id,
      product: productId,
      status: { $in: ['pending', 'accepted'] }
    });
    if (existingOrder) {
      return res.status(400).json({ success: false, message: 'Ya tienes una solicitud pendiente para este producto' });
    }

    const order = new Order({ buyer: req.user.id, product: productId });
    await order.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al crear orden' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('product', 'title price image')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener órdenes' });
  }
};

// ✅ Pedidos recibidos como vendedor
exports.getSellerOrders = async (req, res) => {
  try {
    const myProducts = await Product.find({ seller: req.user.id }).select('_id');
    const productIds = myProducts.map(p => p._id);

    const orders = await Order.find({ product: { $in: productIds } })
      .populate('product', 'title price image')
      .populate('buyer', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener pedidos recibidos' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('product', 'seller title')
      .populate('buyer', 'email');

    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

    if (order.product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo el vendedor o admin puede cambiar el estado' });
    }

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    order.status = status;
    await order.save();

    await sendEmail(
      order.buyer.email,
      'Actualización de tu pedido en LowissShop',
      `<p>Tu pedido para "<strong>${order.product.title}</strong>" ha cambiado a: <strong>${status}</strong></p>`
    );

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};