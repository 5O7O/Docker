const request = require('supertest');
const app = require('../server');

describe('Pruebas de Productos', () => {
  let token;
  beforeAll(async () => {
    const login = await request(app).post('/login')
      .send({ email: 'juan@test.com', password: '1234' });
    token = login.body.token;
  });

  it('Devuelve lista de productos con token válido', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Rechaza acceso sin token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(401);
  });
});
