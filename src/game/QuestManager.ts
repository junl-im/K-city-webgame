export class QuestManager {
  private quests = [{id:'daily', progress:0, target:30, completed:false}];
  onMonsterKilled() { this.quests[0].progress++; if(this.quests[0].progress >= this.quests[0].target) this.quests[0].completed = true; }
  getQuests() { return this.quests; }
}