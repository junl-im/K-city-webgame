import * as PIXI from 'pixi.js';
export class TiledLoader {
  async load(jsonUrl: string) {
    const res = await fetch(jsonUrl);
    return res.json();
  }
}