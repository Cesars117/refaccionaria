# Configuración de Deployment

Este proyecto se despliega manualmente a Hostinger usando el paquete `deploy.zip` y la carpeta `.next/standalone`.

## 🛠️ Flujo de deploy Hostinger

1. Genera el build localmente:
   ```bash
   npm install
   npm run build
   ```

2. Empaqueta el contenido de `.next/standalone` y los archivos necesarios para el servidor.

3. Sube `deploy.zip` a la ruta de Hostinger indicada en los scripts de deploy.

4. En el servidor de Hostinger, asegúrate de tener la siguiente configuración en `.env.production`:
   - `DATABASE_URL` apuntando al MySQL de Hostinger
   - `NEXTAUTH_URL` al dominio de la app
   - `NEXTAUTH_SECRET`

5. Reinicia la app en el panel de Hostinger o mediante el script de deploy.

## 🔧 Notas importantes

- El flujo actual ya no usa Vercel.
- El deploy en Hostinger debe ejecutarse con `npm install --omit=dev` para no instalar dependencias de desarrollo.
- `@prisma/client` debe estar en `dependencies` y no solo en `devDependencies` para que la app funcione en producción.
- Si se actualiza el esquema Prisma, ejecuta `npx prisma migrate deploy` en el servidor prod.
