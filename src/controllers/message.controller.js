const Message = require('../models/Message');
const Product = require('../models/Product');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, productId, text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
    }

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      if (product.seller.toString() !== receiverId && product.seller.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para enviar este mensaje' });
      }
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      product: productId || null,
      text
    });

    await message.save();
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al enviar mensaje' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id }
      ]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .populate('product', 'title image')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener conversación' });
  }
};

// Devuelve lista de usuarios únicos con los que has hablado
exports.getMyConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 });

    // Extraer contactos únicos
    const contactsMap = new Map();
    messages.forEach(msg => {
      const other = msg.sender._id.toString() === req.user.id ? msg.receiver : msg.sender;
      if (!contactsMap.has(other._id.toString())) {
        contactsMap.set(other._id.toString(), other);
      }
    });

    res.json({ success: true, data: Array.from(contactsMap.values()) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener conversaciones' });
  }
};