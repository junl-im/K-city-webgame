import { describe, expect, it } from 'vitest';
import { newlyAvailableSetWarnings, newlyAvailableOpponentWarnings, setWarnings } from '../opponentSetWarnings.js';

const groups=[['hongdan',['m01-02','m02-02','m03-02']],['cheongdan',['m06-02','m09-02','m10-02']],['chodan',['m04-02','m05-02','m07-02']],['godori',['m02-01','m04-01','m08-02']]];
describe('양쪽 조합 비상',()=>{
 for (const [tag,ids] of groups) it(`${tag}: 양쪽의 두 번째 패만 알리고 상대가 소유하면 알리지 않는다`,()=>{
  for (const owner of ['human','computer']) {
   const key=owner+'Captured',other=owner==='human'?'computerCaptured':'humanCaptured';
   const before={humanCaptured:[],computerCaptured:[],[key]:[ids[0]]};
   const after={...before,[key]:ids.slice(0,2)};
   expect(newlyAvailableSetWarnings(before,after)).toEqual([expect.objectContaining({tag,player:owner})]);
   expect(newlyAvailableOpponentWarnings(before,after)).toEqual(owner==='computer'?[expect.objectContaining({tag,player:owner})]:[]);
   expect(setWarnings(after,owner).map(x=>x.tag)).toContain(tag);
   expect(newlyAvailableSetWarnings(after,after)).toEqual([]);
   expect(newlyAvailableSetWarnings(before,{...after,[other]:[ids[2]]})).toEqual([]);
   expect(newlyAvailableSetWarnings(before,{...after,[key]:ids})).toEqual([]);
  }
 });
});
