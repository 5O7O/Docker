const request = require('supertest');
const app = require('../server');

describe('Pruebas de Autenticación', () => {
  it('Login correcto devuelve token', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'juan@test.com', password: '1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('Login incorrecto devuelve 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'wrong@test.com', password: 'bad' });
    expect(res.statusCode).toBe(401);
  });
});
