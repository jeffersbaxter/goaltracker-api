const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/auth');

// All goal routes require authentication
router.use(authMiddleware);

// Goal routes (now protected)
router.get('/:id', goalController.getGoalById);
router.get('/:id/subgoals', goalController.getSubgoals);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/progress', goalController.logProgress);
router.post('/:id/scale', goalController.manualScale);
router.patch('/:id/archive', goalController.toggleArchive);

module.exports = router;