# Environment Variables Guide

> Copy các biến môi trường này vào file `.env` tương ứng trong từng service.
> **KHÔNG commit file `.env` thực tế lên git.**

---

## Backend (`.env`)

### Core
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NODE_ENV` | Environment | `development` / `production` / `test` |
| `PORT` | Backend port | `5145` |

### Database
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/gr_development` |

### Redis
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### Meilisearch
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `MEILISEARCH_HOST` | Meilisearch URL | `http://localhost:7700` |
| `MEILISEARCH_API_KEY` | Master API key | `masterKey_change_in_production` |

### Clerk (Auth)
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `CLERK_SECRET_KEY` | Clerk secret key (server-side only) | `sk_test_...` |

### Storage (S3/MinIO)
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Access key | `minioadmin` |
| `AWS_SECRET_ACCESS_KEY` | Secret key | `minioadmin123` |
| `AWS_ENDPOINT` | S3 endpoint (MinIO for dev) | `http://localhost:9000` |
| `AWS_BUCKET_NAME` | Bucket name | `gr-uploads` |
| `AWS_FORCE_PATH_STYLE` | Force path-style URLs | `true` |

### Email (SMTP)
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `SMTP_HOST` | SMTP server host | `localhost` |
| `SMTP_PORT` | SMTP server port | `1025` |
| `SMTP_USER` | SMTP username | *(empty for dev)* |
| `SMTP_PASSWORD` | SMTP password | *(empty for dev)* |
| `SMTP_FROM` | From email address | `noreply@gr-project.com` |

### Rate Limiting
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `THROTTLE_TTL` | Time window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `10` |

### CORS
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `CORS_ORIGIN` | Allowed origin | `http://localhost:5146` |

### Monitoring
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `SENTRY_DSN` | Sentry DSN for backend | `https://...@o4511133087039488.ingest.de.sentry.io/...` |

### PayPal
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID | `AaB...` |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API secret | `EFG...` |
| `PAYPAL_MODE` | `sandbox` hoặc `live` | `sandbox` |
| `PAYPAL_WEBHOOK_ID` | Webhook ID (tạo từ dashboard) | `...` |

### Stripe
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (frontend) | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |

---

## Frontend (`.env`)

### Core
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NODE_ENV` | Environment | `development` / `production` |
| `PORT` | Frontend port | `5146` |

### App
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | App URL | `http://localhost:5146` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5145` |

### Clerk (Auth)
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |

### Monitoring
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend | `https://...` |

### Payment (Frontend)
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |

---

## Root (`.env`) — Docker Monitoring
| Biến | Mô tả | Ví dụ |
|---|---|---|
| `PROM_SCRAPE_INTERVAL` | Prometheus scrape interval | `5s` |
| `BACKEND_TARGET` | Backend target for monitoring | `host.docker.internal:5145` |

---

## Setup Checklist

### PayPal Sandbox
1. Tạo account tại [developer.paypal.com](https://developer.paypal.com)
2. Vào **Dashboard > Apps & Credentials** → Tạo app mới
3. Copy `Client ID` và `Secret` vào `.env` backend
4. Tạo webhook tại dashboard, copy `Webhook ID`
5. Test với sandbox accounts (buyer + seller)

### Stripe Test Mode
1. Tạo account tại [dashboard.stripe.com](https://dashboard.stripe.com)
2. Bật **Test mode** → Vào **Developers > API keys**
3. Copy `Secret key` và `Publishable key` vào `.env`
4. Cài Stripe CLI: `stripe listen --forward-to localhost:5145/api/webhook/stripe`
5. Copy `Webhook signing secret` (`whsec_...`) vào `.env`
6. Test với [test card numbers](https://docs.stripe.com/testing#cards): `4242 4242 4242 4242`

### Production Checklist
- [ ] Chuyển `PAYPAL_MODE` từ `sandbox` → `live`
- [ ] Thay PayPal sandbox credentials bằng live credentials
- [ ] Thay Stripe test keys bằng live keys
- [ ] Tạo production webhook URLs (HTTPS required)
- [ ] Setup monitoring & alerting cho payment failures
- [ ] Test end-to-end với real transactions nhỏ trước khi launch
