// Create new routes file: routes/protectedUserRoutes.js

const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/auth');

// All these routes require authentication
router.use(authMiddleware);

// User-specific goal routes
router.get('/:userId/goals', goalController.getUserGoals);
router.get('/:userId/goals/root', goalController.getRootGoals);
router.get('/:userId/goals/tree', goalController.getGoalTree);

module.exports = router;