# LowissShop - Backend

API para la tienda de segunda mano LowissShop. Está hecha con Express, MongoDB y esas cosiats.

### Qué hace la app

Plataforma para comprar/vender cosas usadas. Puedes registrarte, subir productos con foto, poner favoritos, hacer reseñas, mandar mensajes al vendedor y eso.

### Modelos en la base de datos

- User (usuario normal o admin)
- Product (el artículo que vendes)
- Category (categorías tipo home, ropa, etc.)
- Favorite (cuando das like/corazón a un producto)
- Review (reseña con nota y comentario)
- Order (la compra, con estados pending/accepted/rejected/completed)
- Message (mensajes entre comprador y vendedor)

Relaciones rápidas:
- User 1 → N Product (el que vende)
- Product 1 → N Review
- Product 1 → N Order
- User ↔ Product (N:N por favoritos y órdenes)
- Product ↔ Category (N:N)

### Endpoints más importantes

- POST /api/auth/register → crear cuenta (con foto aleatorias)
- POST /api/auth/login → entrar y pillar token
- GET /api/auth/verify/:token → verificar email
- GET /api/products → ver todos los productos (con paginación y filtros)
- POST /api/products → subir producto nuevo (con foto)
- POST /api/orders → hacer una oferta/compra
- POST /api/favorites → añadir favorito
- POST /api/reviews → dejar reseña 

### Cómo ejecutarlo

1. Clona el repo
2. `npm install`
3. Crea un `.env` con:
PORT=3000
MONGO_URI=tu mongo uri
JWT_SECRET=pon algo largo y random
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=tu@gmail.com
EMAIL_PASS=tu app password
text4. `npm run dev`

Y ya debería tirar en http://localhost:3000