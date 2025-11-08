import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.badgeketaka.app',
  appName: 'Badge Ketaka',
  webDir: 'www',
  
  // ✅ Configuration du serveur global
  server: {
    // En production, utilisez votre domaine HTTPS
    // url: 'https://badge-ketaka-backend.onrender.com',
    
    // En développement local
    // url: 'http://192.168.1.X:8100',
    // cleartext: true,
    
    // Schéma Android (remplace l'ancien android.scheme)
    androidScheme: 'https',
    
    // Schéma iOS
    iosScheme: 'capacitor',
    
    // Autoriser HTTP en dev uniquement
    cleartext: false
  },
  
  // Plugins
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fef6f4',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    },
    
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    
    Camera: {
      saveToGallery: false
    }
  },
  
  // Configuration Android
  android: {
    // ✅ Capture automatique des inputs
    captureInput: true,
    
    // ⚠️ false en production (désactive le débogage)
    webContentsDebuggingEnabled: false,
    
    // Autorise le contenu mixte HTTP/HTTPS
    // ⚠️ false en production pour la sécurité
    allowMixedContent: false,
    
    // Couleur de fond
    backgroundColor: '#fef6f4',
    
    // Options de build (pour gradle)
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },
  
  // Configuration iOS
  ios: {
    // Gestion de l'affichage
    contentInset: 'automatic',
    scrollEnabled: true,
    
    // Autorise swipe back
    allowsLinkPreview: false,
    
    // Couleur de fond
    backgroundColor: '#fef6f4',
    
    // Limite la zone de défilement
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;