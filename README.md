# TuPedido360

Plataforma multiempresa de pedidos y administración para restaurantes y
comercios, desarrollada por [Imagen Plus](https://imagenplus.co).

## Modelo inicial

- Un mes de prueba sin costo por negocio.
- Suscripción posterior de $30.000 COP mensuales.
- Subdominio único por negocio: `negocio.tupedido360.co`.
- Pedidos públicos para domicilio o para llevar.
- Pedidos de mesa registrados por meseros y empleados.
- Datos, usuarios y configuración separados por negocio.

## Desarrollo

```bash
cp .env.example .env.local
npm install
npm run dev
```

El esquema PostgreSQL inicial está en `db/schema.sql`.

Las variables `DEMO_USER_EMAIL` y `DEMO_USER_PASSWORD` habilitan una cuenta
temporal de desarrollo. No deben configurarse en producción.
