#!/usr/bin/env node

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

// Script de debug para verificar la configuración de Firebase
console.log('🔍 Verificando configuración de Firebase...\n');

// Verificar variables de entorno
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('📋 Variables de entorno:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${envVar}: NO CONFIGURADA`);
  }
});

console.log('\n🌐 URLs importantes:');
console.log(`📱 Aplicación local: http://localhost:3000`);
console.log(`🔧 Página de debug: http://localhost:3000/debug`);
console.log(`🔐 Página de login: http://localhost:3000/login`);

console.log('\n📝 Próximos pasos:');
console.log('1. Abre http://localhost:3000/debug para verificar la configuración');
console.log('2. Prueba el login en http://localhost:3000/login');
console.log('3. Si hay errores, revisa la consola del navegador');

console.log('\n🚀 ¡Configuración completada!'); 