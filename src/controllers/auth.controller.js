const User = require('../models/User');
const jwt = require('jsonwebtoken');
const zod = require('zod');
const { uploadImage } = require('../utils/cloudinary');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/email');

const registerSchema = zod.object({
  username: zod.string().min(3, 'El username debe tener al menos 3 caracteres'),
  email: zod.string().email('Email inválido'),
  password: zod.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

exports.register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const user = new User(data);

    if (req.file) {
      const avatarUrl = await uploadImage(req.file.path);
      user.avatar = avatarUrl;
    }
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendVerificationEmail(user.email, token);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.'
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, message: err.errors?.[0]?.message || err.message });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!user.verified) {
      return res.status(403).json({ success: false, message: 'Por favor verifica tu email primero' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error en el login' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (user.verified) {
      return res.status(400).json({ success: false, message: 'La cuenta ya está verificada' });
    }

    user.verified = true;
    await user.save();

    res.json({ success: true, message: 'Email verificado correctamente' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Token inválido o expirado' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'Si el email existe, recibirás un enlace de recuperación' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await sendResetPasswordEmail(user.email, token);

    res.json({ success: true, message: 'Enlace de recuperación enviado al email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Token inválido o expirado' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, ...user.toObject() });
  } catch (err) {
    console.error('Error en getMe:', err);
    res.status(500).json({ success: false, message: 'Error al obtener usuario' });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'URL de avatar requerida' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al actualizar avatar' });
  }
};