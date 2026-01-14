const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const goalController = require('../controllers/goalController');

// User routes
router.post('/login', userController.loginUser);
router.post('/refresh', userController.refreshToken);
router.post('/', userController.createUser);

// Protected routes (require authentication)
router.post('/logout', authMiddleware, userController.logoutUser);
router.get('/me', authMiddleware, userController.getCurrentUser);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;