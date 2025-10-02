require("dotenv").config();
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "mi_clave_secreta";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); 
app.use("/images", express.static(path.join(__dirname, "images")));

// --- "Base de datos" en memoria ---
const users = [
  { email: "juan@test.com", password: "1234", username: "Juan" },
  { email: "maria@test.com", password: "abcd", username: "Maria" },
];

const products = [
  { id: 1, name: "Teclado Mecánico", price: 899, image: "/images/teclado.jpg", stock: 5 },
  { id: 2, name: "Mouse Inalámbrico", price: 399, image: "/images/mouse.jpg", stock: 10 },
  { id: 3, name: 'Monitor 24"', price: 2799, image: "/images/monitor.jpg", stock: 2 },
  { id: 4, name: "Auriculares Gaming", price: 699, image: "/images/auriculares.jpg", stock: 8 },
  { id: 5, name: "Laptop Gamer", price: 15999, image: "/images/laptop.jpg", stock: 1 },
  { id: 6, name: "Smartphone 5G", price: 8999, image: "/images/smartphone.jpg", stock: 4 },
  { id: 7, name: 'Tablet 10"', price: 4999, image: "/images/tablet.jpg", stock: 3 },
  { id: 8, name: "Cámara Digital", price: 3499, image: "/images/camara.jpg", stock: 2 },
  { id: 9, name: "Impresora Multifuncional", price: 1299, image: "/images/impresora.jpg", stock: 6 },
  { id: 10, name: "Disco Duro Externo", price: 799, image: "/images/disco_duro.jpg", stock: 10 },
];

// --- Carritos en memoria ---
const carritos = {};

// --- Verifica ID Token de Google ---
async function verifyGoogleIdToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    email: payload.email,
    username: payload.name || payload.email.split("@")[0],
    provider: "google",
    sub: payload.sub,
  };
}

// --- Middleware híbrido: JWT propio o ID Token de Google ---
async function autenticarToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token no encontrado" });

    try {
      const user = jwt.verify(token, SECRET_KEY);
      req.user = { ...user, provider: "local" };
      return next();
    } catch (_) {
      try {
        const gUser = await verifyGoogleIdToken(token);
        req.user = gUser;
        return next();
      } catch (err) {
        return res.status(403).json({ message: "Token inválido" });
      }
    }
  } catch (e) {
    return res.status(500).json({ message: "Error al validar token" });
  }
}

// --- Rutas de autenticación local ---
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "❌ Usuario o contraseña incorrectos" });
  }

  const token = jwt.sign(
    { email: user.email, username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  const existe = users.find((u) => u.email === email);
  if (existe) {
    return res.status(400).send("❌ Este usuario ya está registrado");
  }
  users.push({ username, email, password });
  return res.redirect("/index.html");
});

// --- Rutas protegidas ---
app.get("/api/products", autenticarToken, (req, res) => {
  res.json(products);
});

// --- Endpoints del carrito ---
app.get("/api/carrito", autenticarToken, (req, res) => {
  const email = req.user.email;
  const carrito = carritos[email] || [];
  res.json(carrito);
});

app.post("/api/carrito/add", autenticarToken, (req, res) => {
  const email = req.user.email;
  const { id, name, price, image, cantidad } = req.body;

  if (!id || !name || !price || !image) {
    return res.status(400).json({ message: "Datos incompletos del producto" });
  }
  if (cantidad <= 0) {
    return res.status(400).json({ message: "Cantidad inválida" });
  }

  const productoValido = products.find(p => p.id === id);
  if (!productoValido) {
    return res.status(404).json({ message: "Producto inexistente" });
  }

  const itemExistente = carritos[email]?.find(p => p.id === id);
  const cantidadTotal = (itemExistente ? itemExistente.cantidad : 0) + cantidad;

  if (cantidadTotal > productoValido.stock) {
    return res.status(409).json({ message: "Producto sin stock suficiente" });
  }

  if (!carritos[email]) carritos[email] = [];

  if (itemExistente) {
    itemExistente.cantidad += cantidad;
  } else {
    carritos[email].push({ id, name, price, image, cantidad });
  }

  res.json({ message: "Producto agregado al carrito", carrito: carritos[email] });
});

app.put("/api/carrito/update/:productId", autenticarToken, (req, res) => {
  const email = req.user.email;
  const { productId } = req.params;
  const { cantidad } = req.body;

  if (!carritos[email]) return res.status(404).json({ message: "Carrito vacío" });

  const item = carritos[email].find(p => p.id == productId);
  if (!item) return res.status(404).json({ message: "Producto no encontrado en carrito" });

  const productoValido = products.find(p => p.id == productId);
  if (!productoValido) {
    return res.status(404).json({ message: "Producto inexistente" });
  }

  if (cantidad <= 0) {
    carritos[email] = carritos[email].filter(p => p.id != productId);
  } else if (cantidad > productoValido.stock) {
    return res.status(409).json({ message: "Producto sin stock suficiente" });
  } else {
    item.cantidad = cantidad;
  }

  res.json({ message: "Carrito actualizado", carrito: carritos[email] });
});

app.delete("/api/carrito/remove/:productId", autenticarToken, (req, res) => {
  const email = req.user.email;
  const { productId } = req.params;

  if (!carritos[email]) return res.status(404).json({ message: "Carrito vacío" });

  carritos[email] = carritos[email].filter(p => p.id != productId);
  res.json({ message: "Producto eliminado", carrito: carritos[email] });
});

app.delete("/api/carrito/clear", autenticarToken, (req, res) => {
  const email = req.user.email;
  carritos[email] = [];
  res.json({ message: "Carrito vaciado" });
});

// --- Servidor ---
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🚀 Servidor en http://localhost:${PORT}`)
  );
}


module.exports = app;