// Firebase web config for project hifz-tracker-cd6d0.
// Not a secret: it only identifies the project to the browser. Access is enforced by ../../firestore.rules.
import ownersFile from '../owners.json';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCR3tRyO3_IYDAArXunIX8ziDzC2zZrF2c',
  authDomain: 'hifz-tracker-cd6d0.firebaseapp.com',
  projectId: 'hifz-tracker-cd6d0',
  storageBucket: 'hifz-tracker-cd6d0.firebasestorage.app',
  messagingSenderId: '964232708818',
  appId: '1:964232708818:web:7a41c1d8edb58b8425230b',
};

export const OWNERS = ownersFile.owners.map((e) => e.toLowerCase());

// Local development: on localhost the app talks to the Firebase emulators unless ?live is in the URL.
export const USE_EMULATORS =
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !new URLSearchParams(location.search).has('live');
export const EMULATOR_PROJECT = 'demo-hifz';
