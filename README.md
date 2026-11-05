# Living Love — E-commerce

Tienda editorial y panel de administración para **Living Love** (Chile): livings y sofás a medida, cojines, cortinas PVC, toldos y quitasoles.

## Requisitos

- Docker y Docker Compose **o**
- Python 3.12, Node 20, PostgreSQL 16 (SQLite solo desarrollo local)

## Inicio rápido (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Tienda: http://localhost:3000  
- API: http://localhost:8000/api/docs/  
- MailHog: http://localhost:8025  

### Admin demo

Tras el seed (`seed_livinglove`, incluido en el arranque de Docker):

- URL: http://localhost:3000/admin/login  
- Email: `admin@livinglove.cl`  
- Contraseña: `admin12345`  

## Desarrollo local

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=sqlite:///$(pwd)/db.sqlite3
python manage.py migrate
python manage.py seed_livinglove
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## Seed de datos demo

```bash
python manage.py seed_livinglove
```

Carga categorías, productos demo (`is_demo=True`), telas, comunas RM con despacho $0, cupón `BIENVENIDA`, pasarelas y usuario admin.

## Variables de entorno

Ver `.env.example`. Principales:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL en producción; SQLite local |
| `FRONTEND_URL` | URL pública del Next.js (links de pago) |
| `PAYMENTS_ENCRYPTION_KEY` | Cifrado de credenciales de pasarelas en admin |
| `SUMUP_API_KEY` / `SUMUP_MERCHANT_CODE` | SumUp sandbox/live |
| `NEXT_PUBLIC_API_URL` | Base URL API para el frontend |

## Pasarelas de pago

Todas implementan la interfaz `PaymentProvider` (`create`, `confirm`, `refund`).

| Código | Estado |
|---|---|
| `simulated` | Modo desarrollo con pantalla aprobar/rechazar |
| `sumup` | Integración real (sandbox/live vía credenciales) |
| `webpay`, `mercadopago`, `flow` | Adaptadores listos; operan en simulado hasta configurar credenciales |

Activar/desactivar y modo en **Admin → Pagos** o vía `PATCH /api/admin/payment-providers/`.

Webhooks: `POST /api/payments/{provider}/webhook/`

## Reglas de negocio implementadas

- **Solo cotización** por producto (`price_mode`)  
- **Abono 50%** en productos a medida / opción “A medida”  
- **Despacho** por región/comuna; RM en $0; comunas sin tarifa → “A coordinar”  
- **Retiro en taller**  
- **Boleta / factura** (RUT validado) — PDF adjunto manualmente por admin  
- **Cotizaciones** con link de pago tras respuesta del admin  

## Tests

```bash
cd backend && pytest
cd frontend && npm run lint && npx tsc --noEmit && npm run build
npx playwright test
```

## Estructura

```
backend/     Django 5 + DRF + JWT
frontend/    Next.js 14 App Router + Tailwind (tokens v3)
e2e/         Playwright
docker-compose.yml
```

## Fases del plan

| Fase | Contenido |
|---|---|
| 0 | Monorepo, Docker, CI, design tokens |
| 1 | Catálogo, home, categoría, ficha configurador |
| 2 | Carro, checkout, pagos simulados, cupones |
| 3 | Panel admin (KPIs, pedidos, cotizaciones, ajustes) |
| 4 | SumUp sandbox, webhooks, SEO base, hardening |

### Pendiente / producción

- Hosting, dominio y HTTPS  
- Credenciales live Webpay / Mercado Pago / Flow  
- Integración SII / facturación electrónica  
- Fotografía real en catálogo  
- Política de devoluciones definitiva (texto editable ya disponible en admin)  

---

WhatsApp tienda: +56 9 3222 2939 · Instagram @livinglove.cl
