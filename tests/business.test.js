const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;

describe('Business routes', () => {
  let mongod;
  beforeAll(async () => {
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

  test('create, get, update business flow', async () => {
    // register a user
    const user = { name: 'Owner', email: 'owner@example.com', password: 'password123', role: 'business' };
    const regRes = await request(app).post('/api/auth/register').send(user);
    expect(regRes.status).toBe(201);
    const token = regRes.body.token;

    // create business
    const biz = { name: 'Test Biz', description: 'Nice place' };
    const createRes = await request(app).post('/api/businesses').set('Authorization', `Bearer ${token}`).send(biz);
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe(biz.name);

    const id = createRes.body._id;

    // get list
    const listRes = await request(app).get('/api/businesses');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    // get by id
    const getRes = await request(app).get(`/api/businesses/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body._id).toBe(id);

    // update business (owner)
    const updateRes = await request(app).patch(`/api/businesses/${id}`).set('Authorization', `Bearer ${token}`).send({ description: 'Updated' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.description).toBe('Updated');

    // create admin and delete
    const admin = { name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' };
    const adminRes = await request(app).post('/api/auth/register').send(admin);
    expect(adminRes.status).toBe(201);
    const adminToken = adminRes.body.token;

    const delRes = await request(app).delete(`/api/businesses/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
  });
});
