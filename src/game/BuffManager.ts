export class BuffManager {
  private buffs: any[] = [];
  applyBuff(type: string, value: number, duration: number) {
    this.buffs.push({type, value, endTime: Date.now() + duration});
  }
  getMultiplier(type: string) {
    const b = this.buffs.find(b => b.type === type);
    return b ? b.value : 1;
  }
}