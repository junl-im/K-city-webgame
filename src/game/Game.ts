import * as PIXI from 'pixi.js';
import { Player } from './Player';
import { FirebaseService } from '../firebase/FirebaseService';
import { QuestManager } from './QuestManager';
import { BuffManager } from './BuffManager';

export class Game {
  private app: PIXI.Application;
  private player: Player;
  private firebase: FirebaseService;
  private questManager: QuestManager;
  private buffManager: BuffManager;

  constructor(firebase: FirebaseService) {
    this.firebase = firebase;
    this.questManager = new QuestManager();
    this.buffManager = new BuffManager();

    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    const container = document.getElementById('game-container')!;
    container.appendChild(this.app.view as HTMLCanvasElement);

    this.player = new Player(this.app.stage);
    this.initInput();
  }

  private initInput() {
    window.addEventListener('keydown', (e) => {
      // 간단한 키 입력 처리
    });
  }

  start() {
    this.app.ticker.add(() => {
      // 메인 게임 루프
    });
    console.log('%c[Game] Started with all systems', 'color:#0f0');
  }
}