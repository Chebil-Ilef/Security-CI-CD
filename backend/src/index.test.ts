import request from 'supertest';
import express from 'express';
import { api } from './routes';

const app = express();
app.use(express.json());
app.use('/api', api);

describe('API /api/tasks', () => {
  it('GET returns list', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST creates task', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
  });
});
