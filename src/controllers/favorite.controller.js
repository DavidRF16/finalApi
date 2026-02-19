const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const existingFavorite = await Favorite.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingFavorite) {
      return res.status(400).json({ success: false, message: 'Ya tienes este producto en favoritos' });
    }

    const favorite = new Favorite({
      user: req.user.id,
      product: productId
    });

    await favorite.save();

    res.status(201).json({ success: true, data: favorite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al agregar favorito' });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user.id,
      product: req.params.productId
    });

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorito no encontrado' });
    }

    res.json({ success: true, message: 'Favorito eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al eliminar favorito' });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate({
        path: 'product',
        select: 'title price image seller',
        populate: { path: 'seller', select: 'username avatar' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener favoritos' });
  }
};