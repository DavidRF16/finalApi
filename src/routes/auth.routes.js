const express = require('express');
const multer = require('multer');
const { register, login, verifyEmail, forgotPassword, resetPassword, getMe, updateAvatar } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/update-avatar', protect, updateAvatar);

module.exports = router;