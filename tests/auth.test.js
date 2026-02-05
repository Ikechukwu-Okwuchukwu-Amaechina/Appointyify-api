const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;

describe('Auth routes', () => {
  let mongod;
  beforeAll(async () => {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    app = require('../app');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  test('register and login flow', async () => {
    const user = { name: 'Test', email: 'test@example.com', password: 'password123' };
    const regRes = await request(app).post('/api/auth/register').send(user);
    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeDefined();

    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
