#!/usr/bin/env node

// Script de debug para verificar ownership de challenges
console.log('🔍 Verificando ownership de challenges...\n');

// Simular verificación de challenges (esto se ejecutaría en el navegador)
const debugInstructions = `
📋 INSTRUCCIONES DE DEBUG:

1. Abre las herramientas de desarrollador (F12) en tu navegador
2. Ve a la pestaña Console
3. Pega y ejecuta este código:

// Verificar usuario actual
console.log('👤 Usuario actual:', auth.currentUser?.uid, auth.currentUser?.email);

// Verificar challenges del usuario
const checkUserChallenges = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return;
    }
    
    console.log('\\n🔍 Verificando challenges...');
    
    // Obtener todos los challenges donde el usuario es participante
    const challengesRef = collection(db, 'challenges');
    const q = query(challengesRef, where('participants', 'array-contains', user.uid));
    const querySnapshot = await getDocs(q);
    
    console.log('\\n📊 Challenges encontrados:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const isCreator = data.creatorId === user.uid;
      
      console.log('\\n📋 Challenge:', doc.id);
      console.log('  📝 Nombre:', data.name);
      console.log('  👤 Creador:', data.creatorId);
      console.log('  ✅ Soy el creador:', isCreator);
      console.log('  📦 Archivado:', data.isArchived || false);
      console.log('  👥 Participantes:', data.participants?.length || 0);
      
      if (isCreator) {
        console.log('  🎯 PUEDES ARCHIVAR/DESARCHIVAR ESTE CHALLENGE');
      } else {
        console.log('  ⚠️  NO PUEDES MODIFICAR ESTE CHALLENGE');
      }
    });
    
    // Verificar el challenge específico que está fallando
    const problemChallengeId = 'A3z3MCszy42gVP7D5qDO';
    console.log('\\n🔍 Verificando challenge problemático:', problemChallengeId);
    
    const challengeRef = doc(db, 'challenges', problemChallengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const data = challengeSnap.data();
      console.log('  📝 Nombre:', data.name);
      console.log('  👤 Creador:', data.creatorId);
      console.log('  👤 Usuario actual:', user.uid);
      console.log('  ✅ Soy el creador:', data.creatorId === user.uid);
      console.log('  📦 Archivado:', data.isArchived || false);
      
      if (data.creatorId === user.uid) {
        console.log('  ✅ DEBERÍAS PODER MODIFICAR ESTE CHALLENGE');
      } else {
        console.log('  ❌ NO PUEDES MODIFICAR ESTE CHALLENGE - NO ERES EL CREADOR');
        console.log('  💡 Solución: Usa un challenge que hayas creado tú');
      }
    } else {
      console.log('  ❌ Challenge no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Ejecutar verificación
checkUserChallenges();

4. Revisa los resultados en la consola

🎯 SOLUCIONES POSIBLES:

Si el usuario NO es el creador del challenge:
- Crea un nuevo challenge para testing
- Usa un challenge que hayas creado anteriormente
- Pide al creador original que haga la operación

Si el usuario SÍ es el creador pero sigue fallando:
- Verifica que las reglas de Firestore estén correctas
- Revisa que el token de autenticación sea válido
- Comprueba los logs del servidor para más detalles
`;

console.log(debugInstructions);

console.log('\n🌐 URLs para testing:');
console.log('📱 Aplicación: http://localhost:3000');
console.log('🔧 Debug page: http://localhost:3000/debug');
console.log('📋 Challenges: http://localhost:3000/challenges');

console.log('\n🚀 ¡Ejecuta el código de debug en la consola del navegador!'); 