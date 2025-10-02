# Carrito de Compras con JWT y OAuth - Contenerizado con Docker

Este proyecto corresponde a la **Unidad IV**, donde se contenerizó la aplicación web desarrollada en la Unidad III.  
La aplicación implementa autenticación híbrida (JWT y OAuth con Google) y un sistema de carrito de compras con endpoints protegidos.

---

## **Contenido del proyecto**
- **Backend y Frontend:** Node.js con Express, HTML, CSS y JavaScript.
- **Autenticación:** JWT (local) y OAuth (Google).
- **Contenerización:** Docker y Docker Compose.
- **Archivos principales:**
  - `Dockerfile`  
  - `docker-compose.yml`  
  - `.env` (variables de entorno, no subir a repositorio)  
  - `.env.example` (referencia sin valores sensibles)  
  - `server.js`, `public/` y archivos frontend  

---

## **Variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=5000
SECRET_KEY=tu_clave_secreta
GOOGLE_CLIENT_ID=tu_client_id_de_google
```

> Incluye un archivo `.env.example` (sin valores) para referencia.

---

## **Pasos para ejecutar la aplicación**

### 1. Construir y levantar el contenedor
```bash
docker-compose up --build
```

### 2. Verificar que el contenedor está corriendo
```bash
docker ps
```
Debes ver un contenedor llamado `rau3_app` en ejecución.

### 3. Acceder a la aplicación
Abre tu navegador y entra a:
```
http://localhost:5000
```

La página de login debe mostrarse correctamente.

---

## **Pruebas del proyecto**

### **Desde el navegador**
- Inicia sesión con usuario local (JWT) o con Google (OAuth).
- Accede al carrito y verifica:
  - Carga de productos desde `/api/products`.
  - Agregar, modificar y eliminar productos.
  - Botones: *Finalizar compra*, *Vaciar carrito* y *Cerrar sesión*.

### **Desde Postman**
- Verifica la autenticación y el funcionamiento de los endpoints:
  - `POST /login` → Genera token JWT.  
  - `GET /api/products` → Requiere token válido.  
  - `GET /api/carrito` → Muestra el carrito del usuario.  
  - `POST /api/carrito/add` → Agrega productos validando stock.  
  - `PUT /api/carrito/update/:id` → Actualiza cantidad o elimina si es cero.  
  - `DELETE /api/carrito/remove/:id` → Elimina un producto del carrito.  
  - `DELETE /api/carrito/clear` → Vacía el carrito.  

**Casos de error a validar:**
- Acceso sin token → `401 Unauthorized`
- Token inválido o expirado → `403 Forbidden`
- Producto inexistente → `404 Not Found`
- Cantidad negativa → `400 Bad Request`
- Stock insuficiente → `409 Conflict`

---

## **Apagar el contenedor**
Para detener el servicio, usa:
```bash
docker-compose down
```

---

## **Descripción de la contenerización**
- Se creó un **Dockerfile** basado en Node.js 20 que instala dependencias y expone el puerto configurado.  
- Se configuró **docker-compose.yml** con:
  - Servicio `app` que construye la imagen.
  - Mapeo de puertos `5000:5000`.
  - Variables de entorno desde `.env`.
  - Volumen `.:/app` para desarrollo con cambios en caliente.
  - Reinicio automático con `restart: unless-stopped`.  
- Se verificó que JWT y OAuth funcionan correctamente dentro del contenedor.  

---
