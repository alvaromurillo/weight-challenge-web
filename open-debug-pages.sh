#!/bin/bash

echo "🚀 Abriendo páginas de debug en el navegador..."

# Esperar un momento para asegurar que el servidor esté listo
sleep 2

# Abrir las páginas importantes
echo "📱 Abriendo aplicación principal..."
open "http://localhost:3000"

echo "🔧 Abriendo página de debug..."
open "http://localhost:3000/debug"

echo "🔐 Abriendo página de login..."
open "http://localhost:3000/login"

echo "✅ Páginas abiertas. Revisa las pestañas de tu navegador."
echo ""
echo "📝 Instrucciones para debuggear:"
echo "1. En la página de debug, verifica que todas las configuraciones estén en verde"
echo "2. En la página de login, intenta hacer login con tu email"
echo "3. Si hay errores, abre las herramientas de desarrollador (F12) y revisa la consola"
echo ""
echo "🔍 Si encuentras el error 'auth/api-key-not-valid', verifica:"
echo "   - Que las variables de entorno estén correctamente configuradas"
echo "   - Que el proyecto de Firebase esté activo"
echo "   - Que la autenticación esté habilitada en Firebase Console" 