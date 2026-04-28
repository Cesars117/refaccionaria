@echo off
echo ==========================================
echo SUBIENDO REFACCIONARIA COYOTE A GITHUB
echo ==========================================
git init
git remote remove origin 2>nul
git remote add origin https://github.com/Cesars117/refaccionaria.git
git add .
git commit -m "Refaccionaria Coyote - Sistema Completo con Turso Cloud"
git branch -M main
echo.
echo ==========================================
echo POR FAVOR, AUTORIZA LA CONEXION EN EL NAVEGADOR SI SE TE SOLICITA
echo ==========================================
git push -u origin main
echo.
echo ==========================================
echo PROCESO COMPLETADO. YA PUEDES CERRAR ESTA VENTANA.
echo ==========================================
pause
