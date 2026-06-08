import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD4RvZ2hUCifKBOE2uLEFQFMwTBMcQoGz8",
  authDomain: "k-city-webgame.firebaseapp.com",
  projectId: "k-city-webgame",
  storageBucket: "k-city-webgame.firebasestorage.app",
  messagingSenderId: "764165707172",
  appId: "1:764165707172:web:77cea6d091cd39803b5d31",
  measurementId: "G-W202YGQDF3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export class FirebaseService {
  private currentUser: User | null = null;
  constructor() {
    onAuthStateChanged(auth, (user) => { this.currentUser = user; });
  }
  async loginWithEmail(email: string, password: string) {
    try { const r = await signInWithEmailAndPassword(auth, email, password); return {success:true, user:r.user}; }
    catch(e:any){ return {success:false, error:e.message}; }
  }
  async signUpWithEmail(email: string, password: string) {
    try { const r = await createUserWithEmailAndPassword(auth, email, password); return {success:true, user:r.user}; }
    catch(e:any){ return {success:false, error:e.message}; }
  }
  async loginWithGoogle() {
    try { const p = new GoogleAuthProvider(); const r = await signInWithPopup(auth, p); return {success:true, user:r.user}; }
    catch(e:any){ return {success:false, error:e.message}; }
  }
  async logout() { await signOut(auth); }
  getCurrentUser() { return this.currentUser; }
  validateCharacterName(name: string) {
    const t = name.trim();
    if (t.length < 2 || t.length > 12) return {valid:false, message:'2~12자'};
    const l = t.toLowerCase();
    if (['운영자','마스터','영자','시발','씨발','개새끼'].some(w => l.includes(w))) return {valid:false, message:'사용 불가'};
    return {valid:true};
  }
}