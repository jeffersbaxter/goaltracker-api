// ============================================
// controllers/goalController.js
// ============================================

const Goal = require('../models/Goal');

// @desc    Get all goals for a user
// @route   GET /api/users/:userId/goals
// @access  Public
exports.getUserGoals = async (req, res) => {
  try {
    const { includeArchived, timeframe, goalDirection } = req.query;
    
    const filter = { userId: req.params.userId };
    
    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }
    
    if (timeframe) {
      filter.timeframe = timeframe;
    }
    
    if (goalDirection) {
      filter.goalDirection = goalDirection;
    }

    const goals = await Goal.find(filter).sort({ created: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get root goals (no parent) for a user
// @route   GET /api/users/:userId/goals/root
// @access  Public
exports.getRootGoals = async (req, res) => {
  try {
    const goals = await Goal.findRootGoals(req.params.userId);
    res.json(goals);
  } catch (error) {
    // res.json([]);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get goal tree (hierarchical structure)
// @route   GET /api/users/:userId/goals/tree
// @access  Public
exports.getGoalTree = async (req, res) => {
  try {
    const goalTree = await Goal.findGoalTree(req.params.userId);
    res.json(goalTree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get goal by ID
// @route   GET /api/goals/:id
// @access  Public
exports.getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get subgoals of a goal
// @route   GET /api/goals/:id/subgoals
// @access  Public
exports.getSubgoals = async (req, res) => {
  try {
    const subgoals = await Goal.findSubgoals(req.params.id);
    res.json(subgoals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Public
exports.createGoal = async (req, res) => {
  try {
    const goal = await Goal.create(req.body);
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Public
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Log progress for a goal
// @route   POST /api/goals/:id/progress
// @access  Public
exports.logProgress = async (req, res) => {
  try {
    const { increment = 1 } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await goal.logProgress(increment);
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Manual scale goal
// @route   POST /api/goals/:id/scale
// @access  Public
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

    await goal.manualScale(direction);
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Archive/Unarchive goal
// @route   PATCH /api/goals/:id/archive
// @access  Public
exports.toggleArchive = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
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
// @access  Public
exports.deleteGoal = async (req, res) => {
  try {
    const result = await Goal.deleteGoalAndSubgoals(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal and subgoals deleted successfully', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};