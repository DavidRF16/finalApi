// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');
const favoriteRoutes = require('./src/routes/favorite.routes');
const reviewRoutes = require('./src/routes/review.routes');
const messageRoutes = require('./src/routes/message.routes');

const errorMiddleware = require('./src/middlewares/error.middleware');

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);

// 👇 AÑADE ESTO TEMPORALMENTE
console.log('Rutas auth registradas:');
authRoutes.stack.forEach(r => {
  if (r.route) console.log(r.route.stack[0].method.toUpperCase(), '/api/auth' + r.route.path);
});

app.get('/prueba-email', async (req, res) => {
  try {
    const { sendVerificationEmail } = require('./src/utils/email');
    const dummyToken = 'prueba-token-123456789';
    await sendVerificationEmail(process.env.EMAIL_USER, dummyToken);
    res.json({ success: true, message: `Email de prueba enviado a ${process.env.EMAIL_USER}` });
  } catch (err) {
    console.error('Error en /prueba-email:', err);
    res.status(500).json({ success: false, message: 'Fallo al enviar email de prueba', error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('EMAIL_USER cargado:', process.env.EMAIL_USER || 'NO LEÍDO');
  console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NO LEÍDO');
});