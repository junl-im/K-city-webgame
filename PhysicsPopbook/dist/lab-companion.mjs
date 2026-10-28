/** Short, friendly stage reactions for all twelve physics chapters. */
export const COMPANION_ART = Object.freeze({
  fox:'./assets/fox-professor-v03.webp',
  bear:'./assets/bear-researcher-v05.webp',
  cat:'./assets/cat-adventurer-v05.webp',
  rabbit:'./assets/rabbit-adventurer-v05.webp'
});

const personalities={
  gravity:['bear','곰 연구원'],orbit:['cat','고양이 탐험가'],
  light:['fox','여우 박사'],circuit:['rabbit','토끼 도전자'],
  mechanics:['bear','곰 연구원'],magnet:['cat','고양이 탐험가'],
  sound:['rabbit','토끼 도전자'],inertia:['bear','곰 연구원'],
  friction:['rabbit','토끼 도전자'],buoyancy:['cat','고양이 탐험가'],
  pendulum:['fox','여우 박사'],heat:['rabbit','토끼 도전자']
};

export function companionCue(state){
  const [animal,name]=personalities[state.lesson]||personalities.gravity;
  const active=state.status==='running',done=state.status==='done';
  let speech='함께 실험해 볼까?';
  switch(state.lesson){
    case 'gravity':
      speech=done?(state.air?'깃털은 공기 때문에 늦었어!':'와! 둘이 함께 도착했어!'):
        active?(state.air?'깃털이 살랑살랑~':'같이 떨어지는 중이야!'):'쇠구슬과 깃털을 같이 놓아 보자!';break;
    case 'orbit':
      speech=done?'야호! 행성이 한 바퀴 돌았어!':
        state.orbitRadius>1.2?'멀리서 돌면 시간이 더 걸려!':'행성을 가까이 놓으면 더 빨라!';break;
    case 'light':
      speech=done?'입사각과 반사각이 똑같아!':
        active?'거울에서 빛이 반짝 튀어나와!':'빛을 비추는 방향을 바꿔 봐!';break;
    case 'circuit':
      speech=state.circuitClosed?'찌릿! 전구가 반짝 켜졌어!':'전선 길이 끊어져서 꺼졌어!';break;
    case 'mechanics':
      speech=done?'작은 힘 대신 더 멀리 움직여야 해!':
        state.mechanicsMode==='pulley'?'줄을 당겨서 위로 올려 보자!':'받침점에서 멀수록 힘이 덜 들어!';break;
    case 'magnet':
      speech=state.magnetMaterial==='wood'?'나무 구슬은 꿈쩍도 안 해!':
        done?'철구가 자석에게 쏙!':'철구를 자석 가까이 가져가 봐!';break;
    case 'sound':
      speech=state.soundFrequency>=510?'높은 소리는 파장이 짧아!':
        state.soundFrequency<=170?'낮은 소리는 파장이 길어!':'북이 둥둥! 공기가 흔들려!';break;
    case 'inertia':
      speech=done?'어어! 사과가 앞으로 쏙!':
        state.extraMode==='sudden'?'급정거하면 사과는 어떻게 될까?':'살살 멈춰 볼까?';break;
    case 'friction':
      speech=done?(state.extraMode==='ice'?'빙판 위에서 슈우욱!':'마찰이 우리를 잡아줘!'):
        state.extraMode==='ice'?'빙판은 정말 미끄러워!':'거친 길에서는 잘 버텨!';break;
    case 'buoyancy':
      speech=done?(state.extraMode==='duck'?'오리는 둥둥, 돌은 퐁당!':'돌도 물이 위로 밀어줘!'):
        state.extraMode==='duck'?'노랑 오리를 물에 띄워 봐!':'조약돌이 어디까지 내려갈까?';break;
    case 'pendulum':
      speech=done?'줄이 길면 왕복이 느려져!':
        state.extraMode==='moon'?'달에서는 더 천천히 흔들려!':'별방울이 왔다 갔다~';break;
    case 'heat':
      speech=done?'얼음이 얼마나 녹았나 볼까?':
        active?'따뜻한 물이 얼음을 녹여!':'얼음이 사르르 녹을까?';break;
    default:break;
  }
  let mobileSpeech=speech;
  // A short two-line version prevents speech balloons obscuring small experiments.
  switch(state.lesson){
    case 'gravity':mobileSpeech=done?(state.air?'깃털이 늦게 닿았어!':'둘이 함께 도착!'):active?'떨어지는 중이야!':'같이 놓아 볼까?';break;
    case 'orbit':mobileSpeech=done?'한 바퀴 완료!':state.orbitRadius>1.2?'멀수록 오래 걸려!':'가까우면 빨리 돌아!';break;
    case 'light':mobileSpeech=done?'두 각도가 같아!':active?'빛이 반사돼!':'빛 방향을 바꿔 봐!';break;
    case 'circuit':mobileSpeech=state.circuitClosed?'전구가 반짝!':'회로가 끊겼어!';break;
    case 'mechanics':mobileSpeech=done?'작은 힘도 가능!':state.mechanicsMode==='pulley'?'줄을 당겨 봐!':'멀리 잡으면 쉬워!';break;
    case 'magnet':mobileSpeech=state.magnetMaterial==='wood'?'나무는 그대로!':done?'철구가 쏙!':'철구를 가까이!';break;
    case 'sound':mobileSpeech=state.soundFrequency>=510?'높은 소리!':state.soundFrequency<=170?'낮은 소리!':'둥둥! 흔들려!';break;
    case 'inertia':mobileSpeech=done?'사과가 앞으로 쏙!':state.extraMode==='sudden'?'급정거하면?':'살살 멈춰 볼까?';break;
    case 'friction':mobileSpeech=state.extraMode==='ice'?'빙판은 슈우욱!':'거친 길은 천천히!';break;
    case 'buoyancy':mobileSpeech=state.extraMode==='duck'?'오리가 둥둥!':'돌은 퐁당!';break;
    case 'pendulum':mobileSpeech=state.extraMode==='moon'?'달에서는 느릿느릿!':'흔들흔들 그네!';break;
    case 'heat':mobileSpeech=done?'얼음이 얼마나 녹았지?':active?'얼음이 사르르!':'녹는 모습 볼까?';break;
    default:break;
  }
  return {animal,name,speech,mobileSpeech,mood:done?'yay':active?'excited':'curious'};
}
