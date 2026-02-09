const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;

describe('Booking routes', () => {
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

  test('create booking and list mine', async () => {
    // register a user
    const user = { name: 'Booker', email: 'booker@example.com', password: 'password123', role: 'business' };
    const regRes = await request(app).post('/api/auth/register').send(user);
    expect(regRes.status).toBe(201);
    const token = regRes.body.token;

    // create a business
    const bizRes = await request(app).post('/api/businesses').set('Authorization', `Bearer ${token}`).send({ name: 'Biz for booking', workingHours: '09:00-17:00' });
    expect(bizRes.status).toBe(201);
    const businessId = bizRes.body._id;

    // create booking
    const booking = { business: businessId, date: '2026-02-15', startTime: '10:00' };
    const createRes = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(booking);
    expect(createRes.status).toBe(201);
    expect(createRes.body.business).toBe(businessId);

    const bookingId = createRes.body._id;

    // list mine
    const mineRes = await request(app).get('/api/bookings/mine').set('Authorization', `Bearer ${token}`);
    expect(mineRes.status).toBe(200);
    expect(Array.isArray(mineRes.body)).toBe(true);

    // get by id
    const getRes = await request(app).get(`/api/bookings/${bookingId}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body._id).toBe(bookingId);
  });
});
