const request = require('supertest');
const app = require('../server');

describe('Pruebas del Carrito', () => {
  let token;
  beforeAll(async () => {
    const login = await request(app).post('/login')
      .send({ email: 'juan@test.com', password: '1234' });
    token = login.body.token;
  });

  it('Agregar producto al carrito', async () => {
    const producto = { id: 1, name: "Teclado Mecánico", price: 899, image: "/images/teclado.jpg", cantidad: 1 };
    const res = await request(app)
      .post('/api/carrito/add')
      .set('Authorization', `Bearer ${token}`)
      .send(producto);
    expect(res.statusCode).toBe(200);
  });

  it('Actualizar cantidad de producto', async () => {
    const res = await request(app)
      .put('/api/carrito/update/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ cantidad: 3 });
    expect(res.statusCode).toBe(200);
  });

  it('Vaciar carrito', async () => {
    const res = await request(app)
      .delete('/api/carrito/clear')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
