// Tipos globales para Firebase App Hosting
declare global {
  interface Window {
    FIREBASE_WEBAPP_CONFIG?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      measurementId?: string;
    };
  }
}

export {}; 