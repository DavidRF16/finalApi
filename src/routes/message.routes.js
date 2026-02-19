const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { sendMessage, getConversation, getMyConversations } = require('../controllers/message.controller');

const router = express.Router();
router.use(protect);

router.post('/', sendMessage);
router.get('/my-conversations', getMyConversations);
router.get('/conversation/:otherUserId', getConversation);

module.exports = router;