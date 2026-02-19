const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadImage } = require('../utils/cloudinary');
const zod = require('zod');

const productSchema = zod.object({
  title: zod.string().min(3),
  description: zod.string().optional(),
  price: zod.coerce.number().positive(),
  categories: zod.array(zod.string()).optional(),
  status: zod.enum(['draft', 'active', 'sold']).optional()
}).partial();

exports.getMyProducts = async (req, res) => {
  try {
    console.log('getMyProducts - req.user:', req.user); // 👈 debug
    const userId = req.user.id || req.user._id;
    const products = await Product.find({ seller: userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Error en getMyProducts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'createdAt', order = 'desc', category, minPrice, maxPrice } = req.query;

    const query = { status: 'active' };

    if (category) {
      const cat = await Category.findOne({ name: category });
      if (cat) {
        query.categories = cat._id;
      } else {
        query.categories = null;
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const products = await Product.find(query)
      .populate('seller', 'username avatar')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (err) {
    console.error('Error en getProducts:', err);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id)
      .populate('seller', 'username avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    try {
      product = await Product.populate(product, { path: 'categories', select: 'name' });
    } catch (err) {
      console.error('Error populating categories:', err);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener el producto' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Convertir categories a array si llega como string desde FormData
    if (req.body.categories && !Array.isArray(req.body.categories)) {
      req.body.categories = [req.body.categories];
    }

    const data = productSchema.parse(req.body);
    data.seller = req.user.id || req.user._id;

    if (data.categories && data.categories.length > 0) {
      const categoryIds = [];
      for (const name of data.categories) {
        const cat = await Category.findOne({ name: name.trim() });
        if (cat) categoryIds.push(cat._id);
      }
      data.categories = categoryIds;
    }

    if (req.file) {
      data.image = await uploadImage(req.file.path);
    }

    const product = new Product(data);
    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, message: err.errors?.[0]?.message || err.message });
    }
    console.error('Error creando producto:', err);
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const userId = req.user.id || req.user._id;
    if (product.seller.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar este producto' });
    }

    if (req.body.categories && !Array.isArray(req.body.categories)) {
      req.body.categories = [req.body.categories];
    }

    const data = productSchema.parse(req.body);

    if (data.categories && data.categories.length > 0) {
      const categoryIds = [];
      for (const name of data.categories) {
        const cat = await Category.findOne({ name: name.trim() });
        if (cat) categoryIds.push(cat._id);
      }
      data.categories = categoryIds;
    }

    if (req.file) {
      data.image = await uploadImage(req.file.path);
    }

    Object.assign(product, data);
    await product.save();

    res.json({ success: true, data: product });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, message: err.errors?.[0]?.message || err.message });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const userId = req.user.id || req.user._id;
    if (product.seller.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este producto' });
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
};