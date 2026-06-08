import * as PIXI from 'pixi.js';
export class Player {
  public sprite: PIXI.Sprite;
  public x = 400; public y = 300;
  public level = 1; public kills = 0;
  private speed = 3.5;
  constructor(stage: PIXI.Container) {
    const g = new PIXI.Graphics();
    g.beginFill(0x4a90e2); g.drawRect(-16,-24,32,48); g.endFill();
    this.sprite = new PIXI.Sprite(g.generateTexture());
    this.sprite.anchor.set(0.5);
    stage.addChild(this.sprite);
  }
  update(keys: any) {
    if (keys['w'] || keys['arrowup']) this.y -= this.speed;
    if (keys['s'] || keys['arrowdown']) this.y += this.speed;
    if (keys['a'] || keys['arrowleft']) this.x -= this.speed;
    if (keys['d'] || keys['arrowright']) this.x += this.speed;
    this.sprite.x = this.x; this.sprite.y = this.y;
  }
}