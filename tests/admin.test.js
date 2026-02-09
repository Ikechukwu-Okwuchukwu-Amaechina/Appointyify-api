const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
let app;

describe('Admin routes', () => {
  let mongod;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    app = require('../app');

    // Create admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'admin' });
    adminToken = adminRes.body.token;

    // Create regular user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@test.com', password: 'user123' });
    userToken = userRes.body.token;
  }, 15000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  test('GET /api/admin/stats - should return platform stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.usersCount).toBeGreaterThan(0);
    expect(res.body.businessesCount).toBeDefined();
    expect(res.body.bookingsCount).toBeDefined();
  });

  test('GET /api/admin/stats - should deny non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(403);
  });

  test('GET /api/admin/users - should return paginated users', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
  });

  test('GET /api/admin/users - should filter by role', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=admin')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.users.every(u => u.role === 'admin')).toBe(true);
  });

  test('GET /api/admin/users - should search by name', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=Admin')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  test('GET /api/admin/businesses - should return businesses', async () => {
    const res = await request(app)
      .get('/api/admin/businesses')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.businesses).toBeDefined();
    expect(res.body.total).toBeDefined();
  });

  test('GET /api/admin/bookings - should return bookings', async () => {
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.bookings).toBeDefined();
    expect(res.body.total).toBeDefined();
  });

  test('DELETE /api/admin/users/:id - should delete user', async () => {
    // Create a user to delete
    const newUser = await request(app)
      .post('/api/auth/register')
      .send({ name: 'ToDelete', email: 'delete@test.com', password: 'pass123' });
    
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newUser.body.token}`);
    
    const userId = meRes.body._id;
    
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.msg).toContain('deleted');
  });
});
