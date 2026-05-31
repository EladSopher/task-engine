const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

describe('POST /api/tasks', () => {
  it('creates a task and returns 201 when given valid data', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', description: 'A description' })
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'Test task',
      description: 'A description',
      status: 'pending',
    });
    expect(response.body.id).toBeDefined();
  });

  it('returns 400 when the title parameter is missing', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ description: 'No title provided' })
      .expect(400);

    expect(response.body).toEqual({ error: 'Title is required' });
  });
});

describe('GET /api/tasks', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.$disconnect();
  });

  it('returns the correct number of limited items when paginating', async () => {
    for (let i = 1; i <= 7; i++) {
      await request(app)
        .post('/api/tasks')
        .send({ title: `Task ${i}` })
        .expect(201);
    }

    const response = await request(app)
      .get('/api/tasks?page=1&limit=5')
      .expect(200);

    expect(response.body).toHaveLength(5);
  });
});
