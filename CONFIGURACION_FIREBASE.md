# Configuración Firebase - Weight Challenge App

## ✅ Configuración Completada

### 1. Variables de Entorno (`.env.local`)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBzSnpSZ2fRq5cIG3hXMuqYXazqri325uI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=weight-challenge-app-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=weight-challenge-app-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=weight-challenge-app-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=742316431711
NEXT_PUBLIC_FIREBASE_APP_ID=1:742316431711:web:886c310185aec80dc63eea
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING=false
```

### 2. Archivos de Configuración
- ✅ `.firebaserc` - Proyecto configurado: `weight-challenge-app-dev`
- ✅ `firebase.json` - Configuración de hosting
- ✅ `.env.local` - Variables de entorno de Firebase

### 3. Scripts de Debug
- ✅ `debug-firebase.js` - Verificar configuración de variables de entorno
- ✅ `open-debug-pages.sh` - Abrir páginas de debug en el navegador

## 🚀 Comandos Útiles

### Iniciar desarrollo
```bash
npm run dev
```

### Verificar configuración
```bash
node debug-firebase.js
```

### Abrir páginas de debug
```bash
./open-debug-pages.sh
```

### Verificar proyecto Firebase
```bash
firebase use
firebase projects:list
```

## 🌐 URLs Importantes

- **Aplicación local**: http://localhost:3000
- **Página de debug**: http://localhost:3000/debug
- **Página de login**: http://localhost:3000/login
- **Aplicación en producción**: https://weight-challenge-app-dev.web.app

## 🔧 Troubleshooting

### Error: "auth/api-key-not-valid"
1. Verificar que todas las variables de entorno estén configuradas
2. Verificar que el proyecto Firebase esté activo
3. Verificar que la autenticación esté habilitada en Firebase Console

### Verificar configuración
1. Ejecutar `node debug-firebase.js`
2. Abrir http://localhost:3000/debug
3. Revisar la consola del navegador (F12)

### Comandos de verificación
```bash
# Verificar variables de entorno
cat .env.local

# Verificar proyecto Firebase
firebase use

# Verificar configuración SDK
firebase apps:sdkconfig web
```

## 📝 Próximos Pasos

1. **Verificar autenticación en Firebase Console**:
   - Ir a https://console.firebase.google.com
   - Seleccionar proyecto "Weight Challenge App"
   - Ir a Authentication > Sign-in method
   - Verificar que "Email/Password" esté habilitado

2. **Probar login**:
   - Abrir http://localhost:3000/login
   - Intentar hacer login con tu email
   - Verificar que recibas el magic link

3. **Revisar logs**:
   - Abrir herramientas de desarrollador (F12)
   - Revisar la pestaña Console
   - Revisar la pestaña Network

## 🎯 Estado Actual

- ✅ Configuración de Firebase completada
- ✅ Variables de entorno configuradas
- ✅ Servidor de desarrollo funcionando
- ✅ Scripts de debug creados
- 🔄 **Pendiente**: Verificar autenticación en Firebase Console
- 🔄 **Pendiente**: Probar login con email 