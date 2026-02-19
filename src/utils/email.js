const nodemailer = require('nodemailer');

console.log('[email.js] Cargando transporter...');
console.log('[email.js] EMAIL_USER:', process.env.EMAIL_USER || 'NO DEFINIDO');
console.log('[email.js] EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'VACÍO');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   
  }
});

// Verificación automática al cargar (para debug)
transporter.verify((error, success) => {
  if (error) {
    console.error('[email.js] Error verificando SMTP:', error.message);
  } else {
    console.log('[email.js] SMTP Gmail OK');
  }
});

const sendVerificationEmail = async (email, token) => {
  const link = `http://localhost:3000/api/auth/verify/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verifica tu cuenta - LowissShop',
    html: `<p>Haz clic aquí para verificar: <a href="${link}">${link}</a></p>`,
  });
};

const sendResetPasswordEmail = async (email, token) => {
  const link = `http://localhost:3000/api/auth/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Restablece tu contraseña',
    html: `<p>Haz clic para restablecer: <a href="${link}">${link}</a></p>`,
  });
};

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail, sendEmail };