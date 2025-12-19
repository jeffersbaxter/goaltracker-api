// ============================================
// routes/goalRoutes.js
// ============================================

// const express = require('express');
// const router = express.Router();
// const goalController = require('../controllers/goalController');

// // User-specific goal routes
// router.get('/users/:userId/goals', goalController.getUserGoals);
// router.get('/users/:userId/goals/root', goalController.getRootGoals);
// router.get('/users/:userId/goals/tree', goalController.getGoalTree);

// // Individual goal routes
// router.get('/:id', goalController.getGoalById);
// router.get('/:id/subgoals', goalController.getSubgoals);
// router.post('/', goalController.createGoal);
// router.put('/:id', goalController.updateGoal);
// router.delete('/:id', goalController.deleteGoal);

// // Goal actions
// router.post('/:id/progress', goalController.logProgress);
// router.post('/:id/scale', goalController.manualScale);
// router.patch('/:id/archive', goalController.toggleArchive);

// module.exports = router;

const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

// Individual goal routes (keep these at /api/goals)
router.get('/:id', goalController.getGoalById);
router.get('/:id/subgoals', goalController.getSubgoals);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

// Goal actions
router.post('/:id/progress', goalController.logProgress);
router.post('/:id/scale', goalController.manualScale);
router.patch('/:id/archive', goalController.toggleArchive);

module.exports = router;