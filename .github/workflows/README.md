# CI/CD — Portal ARCOP

## Secrets requeridos en GitHub → Settings → Secrets → Actions

### Frontend
| Secret | Descripción |
|--------|-------------|
| REACT_APP_API_URL | URL del backend en Cloud Run |
| REACT_APP_RECAPTCHA_SITE_KEY | Site key de reCAPTCHA v3 |
| REACT_APP_FIREBASE_API_KEY | Firebase Web API Key |
| REACT_APP_FIREBASE_PROJECT_ID | ID del proyecto Firebase |
| REACT_APP_FIREBASE_AUTH_DOMAIN | Auth domain del proyecto |
| REACT_APP_FIREBASE_APP_ID | App ID de la web app Firebase |
| FIREBASE_SERVICE_ACCOUNT | JSON de la service account de Firebase Hosting |

### Backend
| Secret | Descripción |
|--------|-------------|
| GCP_SA_KEY | JSON de la service account con permisos Cloud Run + GCR |
| GCP_PROJECT_ID | ID del proyecto GCP |
| CLOUD_RUN_REGION | Región del servicio (ej: us-central1) |

## Flujo de deploy

Push a `main` → ambos jobs corren en paralelo:
- Frontend: build React → Firebase Hosting (producción)
- Backend: build Docker → push GCR → deploy Cloud Run
