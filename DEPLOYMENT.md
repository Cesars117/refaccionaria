# Configuración de Deployment con GitHub Actions

Este proyecto usa GitHub Actions para desplegar automáticamente a Vercel y Hostinger.

## 📋 Requisitos

### Para Vercel:
1. Ve a https://vercel.com/account/tokens
2. Crea un token personal (cópialo)
3. En tu repo GitHub:
   - Settings → Secrets and variables → Actions
   - Agrega estos secrets:
     - `VERCEL_TOKEN`: Tu token de Vercel
     - `VERCEL_ORG_ID`: Tu organization ID (visible en Vercel dashboard)
     - `VERCEL_PROJECT_ID`: El project ID (en Vercel project settings)

### Para Hostinger:
Agrega estos secrets en GitHub (Settings → Secrets):
- `HOSTINGER_HOST`: IP o dominio del servidor (ej: `82.29.86.160`)
- `HOSTINGER_USER`: Usuario SSH (ej: `u441730936`)
- `HOSTINGER_SSH_PORT`: Puerto SSH (por defecto: `65002`)
- `HOSTINGER_SSH_KEY`: Tu clave privada SSH en formato PEM
- `HOSTINGER_PATH`: Ruta remota donde desplegar (ej: `/home/inventory-system`)

## 🔐 Cómo obtener la SSH Key de Hostinger

```bash
# En tu máquina local, conectate a Hostinger
ssh -p 65002 u441730936@82.29.86.160

# O usa la clave privada existente si tienes
cat ~/.ssh/id_rsa  # En Windows: cat $env:USERPROFILE\.ssh\id_rsa
```

## 🚀 Flujo de Deploy Automático

1. **Haces push a `main`**
   ```bash
   git push origin main
   ```

2. **GitHub Actions ejecuta:**
   - ✅ Build y lint
   - ✅ Deploy a Vercel (automático)
   - ✅ Deploy a Hostinger (por SSH)

3. **Verificas:**
   - Vercel: https://tuapp.vercel.app
   - Hostinger: https://tusubdominio.com

## 📝 Notas

- Los deploys solo ocurren en push a `main` (no en PRs)
- Cada push gatilla ambos deploys simultáneamente
- Si uno falla, el otro continúa
- Puedes ver logs en Actions tab del repo

## 🔄 Próximos pasos (Seguridad)

Cuando implementes seguridad, considera:
- Firmar commits (GPG)
- Branch protection rules
- Require status checks before merge
- Environments con approval para prod
- Secrets encryption y rotación
