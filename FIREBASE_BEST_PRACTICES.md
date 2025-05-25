# Firebase SDK Best Practices

Este proyecto sigue las mejores prácticas oficiales de Firebase para App Hosting según la [documentación oficial](https://firebase.google.com/docs/app-hosting/firebase-sdks).

## 🏗️ Arquitectura de SDKs

### Firebase Admin SDK (Server-side)
- **Archivo**: `src/lib/firebase-admin.ts`
- **Uso**: Operaciones del servidor con privilegios administrativos
- **Inicialización**: Automática cuando es posible, fallback a service account

### Firebase Client SDK (Client-side)
- **Archivo**: `src/lib/firebase.ts` (cliente)
- **Archivo**: `src/lib/firebase-server.ts` (servidor como fallback)
- **Uso**: Operaciones del cliente y SSR
- **Inicialización**: Automática con `FIREBASE_WEBAPP_CONFIG`

## 🚀 Inicialización Automática

### Admin SDK
```typescript
// Recomendado: Inicialización automática
const app = initializeApp(); // Sin argumentos

// Fallback: Configuración manual
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'your-project-id'
});
```

### Client SDK
```typescript
// Recomendado: Inicialización automática (App Hosting)
const app = initializeApp(); // FIREBASE_WEBAPP_CONFIG automático

// Fallback: Configuración manual
const app = initializeApp(firebaseConfig);
```

## 🌍 Configuración por Entorno

### Desarrollo Local
- **Admin SDK**: Usa `service-account-key.json`
- **Client SDK**: Usa variables de entorno `NEXT_PUBLIC_*`
- **Credenciales**: `gcloud auth application-default login`

### Firebase App Hosting
- **Admin SDK**: `FIREBASE_CONFIG` automático
- **Client SDK**: `FIREBASE_WEBAPP_CONFIG` automático
- **Credenciales**: Automáticas del entorno

### Producción (Otros)
- **Admin SDK**: `FIREBASE_SERVICE_ACCOUNT_KEY` como variable de entorno
- **Client SDK**: Variables `NEXT_PUBLIC_*`

## 📁 Estructura de Archivos

```
src/lib/
├── firebase-admin.ts     # Admin SDK (servidor)
├── firebase-server.ts    # Client SDK (servidor, fallback)
└── firebase.ts          # Client SDK (cliente)

apphosting.yaml          # Configuración App Hosting
next.config.js           # Configuración Next.js optimizada
service-account-key.json # Credenciales desarrollo (no commitear)
```

## 🔧 Variables de Entorno

### Automáticas (App Hosting)
- `FIREBASE_CONFIG` - Configuración Admin SDK
- `FIREBASE_WEBAPP_CONFIG` - Configuración Client SDK

### Manuales (Desarrollo/Producción)
```env
# Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Admin SDK (producción)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Entorno
NODE_ENV=development|production
```

## 🛡️ Seguridad y Mejores Prácticas

### 1. Separación de SDKs
- ✅ Admin SDK solo en servidor
- ✅ Client SDK en cliente y SSR
- ❌ No mezclar SDKs en el mismo archivo

### 2. Credenciales
- ✅ Service account para Admin SDK
- ✅ API keys públicas para Client SDK
- ❌ No commitear `service-account-key.json`

### 3. Inicialización
- ✅ Usar `initializeApp()` sin argumentos cuando sea posible
- ✅ Verificar variables de entorno automáticas
- ✅ Fallback a configuración manual

### 4. Firestore Rules
- ✅ Admin SDK bypassa las reglas
- ✅ Client SDK respeta las reglas
- ✅ Validación en servidor con Admin SDK

## 🚀 Despliegue en App Hosting

### 1. Configuración
```yaml
# apphosting.yaml
runConfig:
  runtime: nodejs18
  env:
    - variable: NODE_ENV
      value: production
```

### 2. Build
```bash
npm ci
npm run build
```

### 3. Variables Automáticas
- `FIREBASE_CONFIG` se configura automáticamente
- `FIREBASE_WEBAPP_CONFIG` se configura automáticamente
- No necesitas configurar credenciales manualmente

## 🔍 Debugging

### Verificar Inicialización
```typescript
console.log('Admin app initialized:', !!adminApp);
console.log('Client app initialized:', !!clientApp);
```

### Variables de Entorno
```bash
# Verificar configuración automática
echo $FIREBASE_CONFIG
echo $FIREBASE_WEBAPP_CONFIG
```

### Logs de Inicialización
- `🚀 Using automatic initialization` - Configuración automática exitosa
- `🛠️ Using manual configuration` - Fallback a configuración manual
- `♻️ Using existing Firebase app` - Reutilizando instancia existente

## 📚 Referencias

- [Firebase App Hosting SDK Integration](https://firebase.google.com/docs/app-hosting/firebase-sdks)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Client SDK](https://firebase.google.com/docs/web/setup)
- [Next.js with Firebase](https://firebase.google.com/docs/hosting/nextjs) 