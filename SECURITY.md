# Seguridad — Living Love

Documento de referencia para despliegue en producción. No sustituye una auditoría externa.

## Variables de entorno obligatorias (producción)

| Variable | Uso |
|---|---|
| `SECRET_KEY` | ≥50 caracteres aleatorios; firma Django y (por defecto) cifrado de credenciales de pasarelas |
| `DEBUG` | `0` |
| `ALLOWED_HOSTS` | Dominios explícitos del API (sin `*`) |
| `CORS_ALLOWED_ORIGINS` | Origen(es) del frontend Next.js |
| `FRONTEND_URL` | URL pública HTTPS de la tienda |
| `DATABASE_URL` | PostgreSQL |
| `PAYMENT_WEBHOOK_SECRET` | Secreto compartido para webhooks (`X-Payment-Webhook-Secret`) o base para HMAC |
| `PAYMENTS_ENCRYPTION_KEY` | ≥32 caracteres para cifrar credenciales en admin |
| `ADMIN_INITIAL_PASSWORD` | Contraseña del admin creado por `seed_livinglove` (rotar tras primer login) |
| `SECURE_SSL_REDIRECT` | `1` cuando el API está detrás de HTTPS en producción |

Opcionales por pasarela: `PAYMENT_WEBHOOK_SECRET_WEBPAY`, `_MERCADOPAGO`, `_FLOW`, `_SUMUP` (sobreescriben el global).

## Variables que NO deben activarse en producción

| Variable | Riesgo |
|---|---|
| `PAYMENTS_ALLOW_SIMULATED_CONFIRM=1` | Permite marcar pagos **simulados** como aprobados sin pasarela real |
| `DEBUG=1` | Expone trazas, relaja webhooks y sesiones de carro débiles |

CI/e2e local puede usar `PAYMENTS_ALLOW_SIMULATED_CONFIRM=1` y contraseña demo; no replicar en prod.

## Autenticación JWT

- Access 15 min / refresh 7 días (`SIMPLE_JWT` en `config/settings.py`).
- El frontend guarda tokens en cookies **httpOnly** (`ll_access`, `ll_refresh`) vía `POST /api/auth/session`.
- En producción: HTTPS obligatorio; cookies seguras las gestiona el proxy/Next con `Secure` y `SameSite`.
- Registro: contraseña ≥8 caracteres + validadores Django (`CommonPassword`, etc.).
- Límites: login 30/h, registro 15/h por IP (`apps/common/throttling.py`).

## Webhooks de pago

- Sin `PAYMENT_WEBHOOK_SECRET` y `DEBUG=0` → **403** (fail-closed).
- Verificación admitida (cualquiera válida):
  - Header `X-Payment-Webhook-Secret` igual al secreto (global o por pasarela).
  - HMAC-SHA256 del body en `X-Webhook-Signature` / `X-Payment-Webhook-Signature`.
  - Mercado Pago: cabecera `X-Signature` (formato `ts=…,v1=…`) + `X-Request-Id`.
- En `DEBUG`, se acepta `dev-webhook-secret` o header vacío solo para desarrollo local.
- Confirmación simulada: `POST /api/payments/simulated/<id>/confirm/` solo con `DEBUG` o `PAYMENTS_ALLOW_SIMULATED_CONFIRM=1`.
- Resolución de pago en webhook: por `external_id` / token; `payment_id` en body solo si `DEBUG=1`.

## Autorización admin

- Mutaciones y listados bajo `/api/admin/*` exigen `IsAdminRole` (`role=admin` o superuser).
- Clientes autenticados solo ven sus pedidos/cotizaciones/direcciones (`user=` en querysets).

## IDOR / carro anónimo

- Claves de carro cliente deben ser UUID o token opaco ≥32 caracteres.
- Claves cortas/adivinables (p. ej. `e2e-cart-session`) → **400** salvo `DEBUG` o `PAYMENTS_ALLOW_SIMULATED_CONFIRM=1`.
- Si no hay clave, el servidor genera UUID v4.

## Rate limiting (DRF)

| Ámbito | Límite aprox. |
|---|---|
| Login | 30/h por IP |
| Registro | 15/h |
| Cotización (`POST /api/quotes/`) | 40/h |
| Checkout | 25/h |
| Inicio/confirmación pago | 40/h |
| Webhooks | 120/min por IP y pasarela |

## Subida de archivos (admin)

- Imágenes: JPEG/PNG/WebP/GIF, máx. 5 MB, magic bytes.
- PDF tributario: máx. 10 MB, prefijo `%PDF`.
- CSV import: máx. 2 MB; nombre sanitizado (sin `..`).

## Cabeceras Django (`DEBUG=0`)

`SECURE_SSL_REDIRECT`, HSTS, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS=DENY`, cookies de sesión/CSRF seguras.

Ejecutar `python manage.py check --deploy` antes de publicar.

## Riesgos residuales

- Pasarelas Webpay/Mercado Pago/Flow operan en modo simulado hasta credenciales live; la verificación criptográfica real del proveedor debe completarse al integrar APIs oficiales.
- Cotizaciones pagables por `payment_token` en URL: token largo pero enlazable; considerar expiración corta y no indexar.
- `QuotePayView` y checkout anónimo no exigen cuenta; mitigado por rate limits y montos calculados server-side.
- Sin lista negra JWT refresh en servidor (rotación activa; revocación global requeriría blacklist/Redis).
- SumUp live depende de credenciales en env o admin cifradas; rotar si hay fuga.
- Panel admin comparte JWT con tienda: proteger cuenta admin con MFA a nivel IdP/hosting recomendado.

## Checklist rápido pre-go-live

1. `DEBUG=0`, `SECRET_KEY` fuerte, `ALLOWED_HOSTS` y CORS correctos.
2. `PAYMENT_WEBHOOK_SECRET` configurado en API y en el panel de cada pasarela.
3. `PAYMENTS_ALLOW_SIMULATED_CONFIRM` ausente o `0`.
4. Desactivar o restringir pasarela `simulated` en admin.
5. Cambiar contraseña admin sembrada (`ADMIN_INITIAL_PASSWORD` ≠ demo).
6. Revisar `python manage.py check --deploy` y pytest/Playwright en CI.
