// // ============================================
// // routes/userRoutes.js
// // ============================================

// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');

// router.post('/login', userController.loginUser); // Add this line
// router.get('/', userController.getAllUsers);
// router.get('/:id', userController.getUserById);
// router.post('/', userController.createUser);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

// module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const goalController = require('../controllers/goalController');

// User routes
router.post('/login', userController.loginUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// User-specific goal routes (add these)
router.get('/:userId/goals', goalController.getUserGoals);
router.get('/:userId/goals/root', goalController.getRootGoals);
router.get('/:userId/goals/tree', goalController.getGoalTree);

module.exports = router;