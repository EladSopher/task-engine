const taskModel = require('../models/taskModel');

async function createTask(req, res) {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const task = await taskModel.addTask({
    title,
    description: description ?? null,
    status: 'pending',
  });

  res.status(201).json(task);
}

async function getAllTasks(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const { status } = req.query;

  const tasks = await taskModel.getAllTasks({ page, limit, status });
  res.status(200).json(tasks);
}

module.exports = {
  createTask,
  getAllTasks,
};
