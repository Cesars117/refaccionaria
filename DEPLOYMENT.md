# Configuración de Deployment con GitHub Actions

Este proyecto usa GitHub Actions para desplegar automáticamente a Vercel.

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

## 🚀 Flujo de Deploy Automático

1. **Haces push a `main`**
   ```bash
   git push origin main
   ```

2. **GitHub Actions ejecuta:**
   - ✅ Build y lint
   - ✅ Deploy a Vercel (automático)

3. **Verificas:**
   - Vercel: https://tuapp.vercel.app

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
