const prisma = require('../lib/prisma');

async function getAllTasks({ page = 1, limit = 10, status } = {}) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  return prisma.task.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

async function addTask(data) {
  return prisma.task.create({ data });
}

module.exports = {
  getAllTasks,
  addTask,
};
