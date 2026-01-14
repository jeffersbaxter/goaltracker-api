// controllers/goalController.js

const Goal = require('../models/Goal');

// Helper function to check and reset goals
const checkAndResetGoals = async (goals) => {
  for (let goal of goals) {
    if (goal.resetFrequency !== 'never') {
      const wasReset = goal.checkReset();
      if (wasReset) {
        await goal.save();
      }
    }
  }
  return goals;
};

// @desc    Get all goals for a user
// @route   GET /api/protected/users/:userId/goals
// @access  Private
exports.getUserGoals = async (req, res) => {
  try {
    const { includeArchived, timeframe, goalDirection } = req.query;
    
    // Verify the requesting user has access to this user's goals
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const filter = { userId: req.params.userId };
    
    if (includeArchived !== 'true') {
      filter.isArchived = false;
      filter.isActive = true;
    }
    
    if (timeframe) {
      filter.timeframe = timeframe;
    }
    
    if (goalDirection) {
      filter.goalDirection = goalDirection;
    }

    const goals = await Goal.find(filter).sort({ created: -1 });
    
    // Check and reset all goals before returning
    await checkAndResetGoals(goals);
    
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get root goals (no parent) for a user
// @route   GET /api/protected/users/:userId/goals/root
// @access  Private
exports.getRootGoals = async (req, res) => {
  try {
    // Verify the requesting user has access to this user's goals
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const goals = await Goal.findRootGoals(req.params.userId);
    
    // Check and reset all goals before returning
    await checkAndResetGoals(goals);
    
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get goal tree (hierarchical structure)
// @route   GET /api/protected/users/:userId/goals/tree
// @access  Private
exports.getGoalTree = async (req, res) => {
  try {
    // Verify the requesting user has access to this user's goals
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const goalTree = await Goal.findGoalTree(req.params.userId);
    
    // Check and reset all goals before returning
    await checkAndResetGoals(goalTree);
    
    res.json(goalTree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get goal by ID
// @route   GET /api/goals/:id
// @access  Private
exports.getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Verify the requesting user owns this goal
    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check and reset before returning
    if (goal.resetFrequency !== 'never') {
      const wasReset = goal.checkReset();
      if (wasReset) {
        await goal.save();
      }
    }
    
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get subgoals of a goal
// @route   GET /api/goals/:id/subgoals
// @access  Private
exports.getSubgoals = async (req, res) => {
  try {
    const parentGoal = await Goal.findById(req.params.id);
    
    if (!parentGoal) {
      return res.status(404).json({ error: 'Parent goal not found' });
    }
    
    // Verify the requesting user owns this goal
    if (parentGoal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const subgoals = await Goal.findSubgoals(req.params.id);
    
    // Check and reset all subgoals before returning
    await checkAndResetGoals(subgoals);
    
    res.json(subgoals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
  try {
    // Ensure the goal is being created for the authenticated user
    const goalData = {
      ...req.body,
      userId: req.userId // Use authenticated user's ID
    };
    
    // If parentId is provided, verify it exists and belongs to the user
    if (goalData.parentId) {
      const parentGoal = await Goal.findById(goalData.parentId);
      if (!parentGoal) {
        return res.status(404).json({ error: 'Parent goal not found' });
      }
      if (parentGoal.userId.toString() !== req.userId) {
        return res.status(403).json({ error: 'Access denied to parent goal' });
      }
    }
    
    const goal = await Goal.create(goalData);
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Verify the requesting user owns this goal
    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Don't allow changing userId
    delete req.body.userId;
    
    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Log progress for a goal
// @route   POST /api/goals/:id/progress
// @access  Private
exports.logProgress = async (req, res) => {
  try {
    const { increment = 1 } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify the requesting user owns this goal
    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // This will check for reset and log progress
    await goal.logProgress(increment);
    
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Manual scale goal
// @route   POST /api/goals/:id/scale
// @access  Private
exports.manualScale = async (req, res) => {
  try {
    const { direction } = req.body; // 'up' or 'down'
    
    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "up" or "down"' });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify the requesting user owns this goal
    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await goal.manualScale(direction);
    
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Archive/Unarchive goal
// @route   PATCH /api/goals/:id/archive
// @access  Private
exports.toggleArchive = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify the requesting user owns this goal
    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    goal.isArchived = !goal.isArchived;
    await goal.save();

    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Delete goal and all subgoals
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Verify the requesting user owns this goal
    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await Goal.deleteGoalAndSubgoals(req.params.id);

    res.json({ 
      message: 'Goal and subgoals deleted successfully', 
      deleted: result.deleted 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};