import { Game } from './game/Game';
import { FirebaseService } from './firebase/FirebaseService';

const firebaseService = new FirebaseService();
const game = new Game(firebaseService);
game.start();

console.log('%c[SOL ONLINE] Full Code Version - All Systems Included', 'color:#0f0');