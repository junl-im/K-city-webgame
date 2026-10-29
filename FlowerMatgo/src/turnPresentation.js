// Visual-only presentation. Game state is displayed only AFTER this sequence;
// these sprites never affect deck order, captures, scoring or saved state.
// Timing is intentionally explicit: first the played card collides, then the
// pile is drawn, then the captured sprites move, and only then may UI commit.
import { specialPresentation } from './specialPresentation.js';
import { specialMoment } from './specialMoment.js';
import { getCard } from './engine/cards';
import { capturedCardNotice } from './floorLayout.js';
export const TURN_STAGES = Object.freeze({
  land: 320,
  draw: 510,
  flip: 825,
  collect: 1180,
  complete: 1820
});
export const TURN_PRESENTATION_MS = TURN_STAGES.complete;
export const CARD_ASPECT = Object.freeze({width:248,height:340});
export const MAX_CAPTURE_SPRITES = 6;
export const CAPTURE_STAGGER_MS = 38;
export const SPECIAL_CONTACT_MS = 480;
export function cardHeightForWidth(width) {
  return width * CARD_ASPECT.height / CARD_ASPECT.width;
}
export function captureVisualType(cardId, asDoubleJunk = false) {
  if (cardId === 'm09-01' && asDoubleJunk) return 'junk';
  const type = getCard(cardId)?.type;
  if (type === 'doubleJunk') return 'junk';
  return ['bright','animal','ribbon','junk'].includes(type) ? type : null;
}
export function turnCue(result) {
  if (!result) return null;
  const captures = Array.isArray(result.captured) ? result.captured.length : 0;
  const special = specialPresentation(result);
  return {
    played: result.playedCardId || null,
    drawn: result.drawnCardId || null,
    captures,
    capturedIds: Array.isArray(result.captured) ? result.captured : [],
    text: special?.text || (captures >= 2 ? `착! ${captures}장 획득` : captures === 1 ? '쏙! 1장 획득' : '탁!'),
    impact: special ? 'special' : captures >= 2 ? 'capture' : 'land',
    visualKind: special?.kind || (captures ? 'capture' : 'land'),
    soundKind: special?.sound || null
  };
}

export function cardFlightFrames(from, to, opponent = false) {
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = Math.min(2.2, Math.max(.7, to.width / Math.max(1, from.width)));
  return [
    { transform: `translate3d(0px,0px,0) rotate(${opponent ? -8 : 6}deg) scale(1)`, opacity: 1, offset: 0 },
    { transform: `translate3d(${dx * .64}px,${dy * .64 - 38}px,0) rotate(${opponent ? 10 : -12}deg) scale(${Math.max(1, scale * 1.12)})`, opacity: 1, offset: .64 },
    { transform: `translate3d(${dx}px,${dy}px,0) rotate(-2deg) scale(${scale})`, opacity: 1, offset: .88 },
    { transform: `translate3d(${dx}px,${dy}px,0) rotate(0deg) scale(${scale * .96})`, opacity: 0, offset: 1 }
  ];
}

export function captureSweepFrames(from, to, index = 0) {
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  return [
    { transform:`translate3d(0,0,0) rotate(${index % 2 ? 5 : -5}deg) scale(1.12)`, opacity:0, offset:0 },
    { transform:`translate3d(0,-13px,0) rotate(0deg) scale(1.13)`, opacity:1, offset:.18 },
    { transform:`translate3d(${dx*.68}px,${dy*.64-30}px,0) rotate(${index % 2 ? -12 : 12}deg) scale(.91)`, opacity:1, offset:.72 },
    { transform:`translate3d(${dx}px,${dy}px,0) rotate(0deg) scale(.58)`, opacity:0, offset:1 }
  ];
}

function measure(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

export function motionOrigin(element) { return measure(element); }

export function matchingFloorCardId(playedId, floorIds, capturedIds = []) {
  const month = /^m(\d{2})-/.exec(playedId || '')?.[1];
  if (!month) return null;
  const sameMonth = floorIds.filter(id => /^m(\d{2})-/.exec(id)?.[1] === month);
  return sameMonth.find(id => capturedIds.includes(id)) || sameMonth[0] || null;
}

/** Resolve visual pairings in the same order as the rules engine. */
export function resolveTurnLandings(playedId, drawnId, floorIds, capturedIds = [], options = {}) {
  const playedMonth = getCard(playedId)?.month;
  const matches = playedMonth ? floorIds.filter(id => getCard(id)?.month === playedMonth) : [];
  const preferred = options.playedMatchId;
  const playedFloorId = matches.includes(preferred) ? preferred : matchingFloorCardId(playedId, floorIds, capturedIds);
  const consumed = options.ppeok ? [] : (options.bomb || matches.length >= 3 ? matches : playedFloorId ? [playedFloorId] : []);
  const remaining = floorIds.filter(id => !consumed.includes(id));
  const drawnOnPlayed = !!playedId && !!drawnId && !matches.length &&
    getCard(playedId)?.month === getCard(drawnId)?.month && capturedIds.includes(playedId) && capturedIds.includes(drawnId);
  const drawnFloorId = drawnOnPlayed ? null : matchingFloorCardId(drawnId, remaining, capturedIds);
  return { playedFloorId, drawnFloorId, drawnOnPlayed };
}

// A bomb consumes two, three or four cards from the same hand. The rules
// engine returns only its first card as `playedCardId`, so recover the other
// real captured hand cards for the *visual* throw. Do not touch game state.
export function bombFlightCardIds(playedId, capturedIds = [], handIds = [], floorIds = []) {
  if (!playedId) return [];
  const month = getCard(playedId)?.month;
  if (!month) return [playedId];
  const floor = new Set(floorIds);
  const hand = new Set(handIds);
  const candidates = capturedIds.filter(id =>
    getCard(id)?.month === month && !floor.has(id) && (!hand.size || hand.has(id)));
  return [...new Set([playedId, ...candidates])].slice(0, 4);
}

// A tiny stagger leaves BOTH the old floor card and the just-played card
// visible when they meet. Never alter the actual card artwork or game state.
export function stackedLandingRect(rect, hasMatch) {
  if (!rect || !hasMatch) return rect;
  return {
    ...rect,
    left: rect.left + Math.min(11, Math.max(4, rect.width * .15)),
    top: rect.top - Math.min(8, Math.max(3, rect.height * .07))
  };
}

// Deliberately tiny, painted contact beats: a bomb lands card-by-card,
// ttadak answers twice, and ppeok springs backward. Never delay or mutate
// the underlying game turn to play these effects.
export function specialContactBeats(kind, bombCount = 1, throwGap = 0) {
  if (kind === 'bomb') return Array.from({ length: Math.min(4, Math.max(1, bombCount)) }, (_, i) => ({
    at: TURN_STAGES.land + i * throwGap,
    dx: (i % 2 ? -7 : 7),
    dy: -i * 3,
    kind
  }));
  if (kind === 'ttadak') return [
    { at: TURN_STAGES.collect, dx: -15, dy: -3, kind },
    { at: TURN_STAGES.collect + 95, dx: 15, dy: 3, kind }
  ];
  if (kind === 'ppeok') return [{ at: TURN_STAGES.collect, dx: 0, dy: 0, kind }];
  return [];
}

// Select a visible gap so an unmatched card is not visually paired with another card.
export function emptyLandingRect(bounds, occupied, width) {
  if (!bounds || !Number.isFinite(width) || width <= 0) return null;
  const height=cardHeightForWidth(width);
  const inset=3, stepX=Math.max(12,width*.48), stepY=Math.max(12,height*.48);
  const right=bounds.left+bounds.width-inset-width, bottom=bounds.top+bounds.height-inset-height;
  for(let y=bounds.top+inset;y<=bottom;y+=stepY) for(let x=bounds.left+inset;x<=right;x+=stepX) {
    const candidate={left:x,top:y,width,height};
    const overlaps=occupied.some(r=>r && x<r.left+r.width-2 && x+width>r.left+2 && y<r.top+r.height-2 && y+height>r.top+2);
    if(!overlaps)return candidate;
  }
  return null;
}
function freeFloorTarget(root, extra = []) {
  const floor = root.querySelector('.floor-area');
  const bounds=measure(floor);if(!bounds)return null;
  const elements=[...floor.querySelectorAll('[data-card]')];
  const occupied=elements.map(measure).filter(Boolean).concat(extra);
  const width=elements.length ? measure(elements[0])?.width : Math.min(65,Math.max(38,bounds.width/6));
  return emptyLandingRect(bounds,occupied,width);
}

function sceneTarget(root, cue, preferredMatchId) {
  const floor = root.querySelector('.floor-area') || root.querySelector('.field-row');
  if (!floor) return null;
  const matchedRect = preferredMatchId ? measure(root.querySelector(`.floor-area [data-card="${preferredMatchId}"]`)) : matchingFloorRect(root, cue.played, cue.capturedIds);
  if (matchedRect?.width > 10) return matchedRect;
  const empty = freeFloorTarget(root);
  if (empty) return empty;
  const r = measure(floor);
  if (!r || r.width < 10 || r.height < 10) return null;
  const width = Math.min(65, Math.max(38, r.width / 6));
  return { left: r.left + r.width * .50 - width / 2, top: r.top + Math.min(r.height * .5, 65) - width * .68, width, height: cardHeightForWidth(width) };
}

function matchingFloorRect(root, playedId, capturedIds) {
  const onFloor = [...root.querySelectorAll('.floor-area [data-card]')];
  const matchedId = matchingFloorCardId(playedId, onFloor.map(element => element.dataset.card), capturedIds);
  return measure(onFloor.find(element => element.dataset.card === matchedId));
}

function spawnPairContact(root, floorCard, target, delay, fromDraw = false) {
  if (!floorCard || !target) return;
  setTimeout(() => {
    if (!root.querySelector('.scene--game.is-resolving') || !floorCard.isConnected) return;
    // The actual matching card jumps back on impact before the draw begins.
    floorCard.animate([
      {transform:'translateY(0) rotate(0deg) scale(1)',offset:0},
      {transform:`translateY(${fromDraw ? 3 : 6}px) rotate(-5deg) scale(.94)`,offset:.28},
      {transform:'translateY(-7px) rotate(3deg) scale(1.08)',offset:.64},
      {transform:'translateY(0) rotate(0deg) scale(1)',offset:1}
    ],{duration:285,easing:'cubic-bezier(.3,.9,.2,1)'});
    const contact=document.createElement('div');
    contact.className='turn-pair-contact';
    contact.setAttribute('aria-hidden','true');
    contact.style.left=`${target.left+target.width/2}px`;
    contact.style.top=`${target.top+target.height/2}px`;
    contact.innerHTML='<i></i><i></i><i></i><i></i>';
    root.appendChild(contact);
    setTimeout(()=>contact.remove(),450);
  },delay);
}

function pulseDeck(root, delay) {
  setTimeout(() => {
    if (!root.querySelector('.scene--game.is-resolving')) return;
    root.querySelector('.deck-pile .hwatu')?.animate([
      {transform:'rotate(-8deg) translateY(0) scale(1)'},
      {transform:'rotate(-3deg) translateY(-13px) scale(1.07)',offset:.5},
      {transform:'rotate(-8deg) translateY(0) scale(1)'}
    ],{duration:300,easing:'ease-out'});
  },delay);
}

function spawnFlight(root, id, source, target, delay, cardHTML, opponent, isDraw = false, retentionMs = TURN_PRESENTATION_MS) {
  if (!source || !target || !id) return;
  const ghost = document.createElement('div');
  ghost.className = `turn-flight${isDraw ? ' turn-flight--draw' : ''}`;
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.cssText = `left:${source.left}px;top:${source.top}px;width:${source.width}px;height:${source.height}px`;
  ghost.innerHTML = isDraw ? '<span class="hwatu hwatu--back"><span class="hwatu__face"></span></span>' : cardHTML(id);
  root.appendChild(ghost);
  if (!ghost.querySelector('.hwatu')) { ghost.remove(); return; }
  // Played card is fully down when its impact happens; a drawn card must
  // reach the table BEFORE the back-to-front flip begins, never concurrently.
  const duration = isDraw ? TURN_STAGES.flip - TURN_STAGES.draw : TURN_STAGES.land;
  const frames = cardFlightFrames(source, target, opponent);
  if (!isDraw) frames[frames.length - 1] = { ...frames.at(-1), opacity: 1 };
  const animation = ghost.animate(frames, {
    duration, delay, easing: 'cubic-bezier(.2,.68,.15,1)', fill: 'forwards'
  });
  if (isDraw) animation.finished.then(() => ghost.remove()).catch(() => ghost.remove());
  setTimeout(() => ghost.remove(), isDraw ? duration + delay + 150 : retentionMs);
}

function spawnFlip(root, id, target, delay, cardHTML) {
  if (!id || !target) return;
  setTimeout(() => {
    if (!root.isConnected) return;
    const flip = document.createElement('div');
    flip.className = 'turn-deck-flip';
    flip.setAttribute('aria-hidden', 'true');
    flip.style.cssText = `left:${target.left}px;top:${target.top}px;width:${target.width}px;height:${target.height}px`;
    flip.innerHTML = `<span class="turn-deck-flip__spin"><span class="turn-deck-flip__side turn-deck-flip__side--back"><span class="hwatu hwatu--back"><span class="hwatu__face"></span></span></span><span class="turn-deck-flip__side turn-deck-flip__side--front">${cardHTML(id)}</span></span>`;
    root.appendChild(flip);
    setTimeout(() => flip.remove(), 270);
  }, delay);
}

// A single, tiny paper label acknowledges the entire bundle at the
// destination. Unlike the individual sprites it never blocks a card tap.
function spawnCapturedNotice(root, destination, count, delay) {
  const label = capturedCardNotice(count);
  if (!label) return;
  setTimeout(() => {
    if (!root.querySelector('.scene--game.is-resolving')) return;
    const rect = measure(destination);
    if (!rect) return;
    const sticker = document.createElement('span');
    sticker.className = 'turn-capture-notice';
    sticker.setAttribute('aria-hidden','true');
    sticker.textContent = label;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    sticker.style.left = `${Math.max(65,Math.min(screenWidth - 65,rect.left + rect.width/2))}px`;
    sticker.style.top = `${Math.max(45,Math.min(screenHeight - 45,rect.top - 10))}px`;
    root.appendChild(sticker);
    setTimeout(() => sticker.remove(),640);
  },delay);
}

function spawnCaptureSweep(root, ids, source, drawnTarget, cue, player, result, cardHTML, sound) {
  if (!ids.length || !source) return;
  const destination = root.querySelector(player === 'human' ? '.collection-rack' : '.captured-grid');
  if (!measure(destination)) return;
  const bouncedGroups = new Set();
  const width = player === 'human' ? 40 : 35;
  const asDoubleJunk = player === 'human'
    ? result?.state?.humanGookjinAsDoubleJunk : result?.state?.computerGookjinAsDoubleJunk;
  const fromFloor = new Map([...root.querySelectorAll('.floor-area [data-card]')]
    .map(element => [element.dataset.card, measure(element)]));
  // Prioritize captures actually shown on the table, then the two newly
  // played cards. Bonus and stolen pi may have no floor sprite of their own.
  const prioritized = [...new Set([
    ...ids.filter(id => fromFloor.has(id)),
    ...[cue.played, cue.drawn].filter(id => ids.includes(id)),
    ...ids
  ])];
  prioritized.slice(0,MAX_CAPTURE_SPRITES).forEach((id,index) => {
    setTimeout(() => {
      if (!root.isConnected) return;
      const from = fromFloor.get(id) || (id === cue.drawn ? drawnTarget : source);
      const type = captureVisualType(id,asDoubleJunk);
      const group = player === 'human' && type
        ? destination.querySelector(`[data-capture-type="${type}"]`) : null;
      const rect = measure(group || destination);
      if (!rect) return;
      const fan = (index % 3 - 1) * Math.min(10,rect.width*.13);
      const to = {
        left:rect.left + rect.width*.5 - width*.5 + fan,
        top:rect.top + rect.height*.43 - cardHeightForWidth(width)*.5,
        width,height:cardHeightForWidth(width)
      };
      const ghost=document.createElement('div');
      ghost.className='turn-flight turn-flight--collect';
      ghost.setAttribute('aria-hidden','true');
      ghost.style.cssText=`left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
      ghost.innerHTML=cardHTML(id);
      root.appendChild(ghost);
      ghost.animate(captureSweepFrames(from,to,index),{duration:350,easing:'cubic-bezier(.25,.4,.18,1)',fill:'forwards'}).finished.then(()=>ghost.remove()).catch(()=>ghost.remove());
      setTimeout(()=>ghost.remove(),450);
      // On mobile, the earned category itself acknowledges the incoming card.
      // Only one pulse per category per move, even for a multi-card bomb.
      const arrival = group || destination;
      if (!bouncedGroups.has(arrival)) {
        bouncedGroups.add(arrival);
        setTimeout(()=>{
          if (!arrival.isConnected || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
          arrival.animate?.([
            {transform:'translateY(0) scale(1)',filter:'brightness(1)'},
            {transform:'translateY(-3px) scale(1.045)',filter:'brightness(1.13)',offset:.43},
            {transform:'translateY(0) scale(1)',filter:'brightness(1)'}
          ],{duration:300,easing:'cubic-bezier(.18,.78,.28,1)'});
        },225);
      }
    },TURN_STAGES.collect+index*CAPTURE_STAGGER_MS);
  });
  spawnCapturedNotice(root,destination,ids.length,TURN_STAGES.collect + 150);
  setTimeout(() => sound('capture'), TURN_STAGES.collect + 280);
}

function spawnImpact(root, target, text, delay, kind = 'land') {
  if (!target) return;
  setTimeout(() => {
    if (!root.isConnected) return;
    const halo = document.createElement('div');
    halo.className = `turn-impact turn-impact--${kind}`;
    halo.setAttribute('aria-hidden', 'true');
    halo.style.left = `${target.left + target.width / 2}px`;
    halo.style.top = `${target.top + target.height / 2}px`;
    halo.innerHTML = `<span class="turn-impact__ring"></span><span class="turn-impact__text"></span>`;
    halo.querySelector('.turn-impact__text').textContent = text;
    if (['bomb','sweep','ppeok','ttadak','jjok','bright','double'].includes(kind)) {
      const illustration = document.createElement('span');
      illustration.className='turn-impact__illustration';
      illustration.setAttribute('aria-hidden','true');
      halo.insertBefore(illustration,halo.firstChild);
    }
    if (kind === 'bomb' || kind === 'sweep') {
      for (let wave = 0; wave < 2; wave++) {
        const echo = document.createElement('span');
        echo.className = `turn-impact__echo turn-impact__echo--${wave + 1}`;
        echo.setAttribute('aria-hidden','true');
        halo.appendChild(echo);
      }
    }
    if (text !== '탁!') {
      const petalCount = kind === 'bomb' ? 10 : kind === 'sweep' || kind === 'bright' ? 8 : kind === 'ppeok' ? 4 : 6;
      for (let index = 0; index < petalCount; index++) {
        const petal = document.createElement('span');
        petal.className = 'turn-impact__petal';
        petal.style.setProperty('--angle',`${index * 360 / petalCount}deg`);
        petal.style.setProperty('--distance',`${44 + (index % 3) * 9}px`);
        halo.appendChild(petal);
      }
    }
    root.appendChild(halo);
    setTimeout(() => halo.remove(), kind === 'bomb' || kind === 'sweep' ? 860 : 690);
  }, delay);
}

function spawnSpecialContacts(root, target, beats) {
  if (!target) return;
  for (const beat of beats) {
    setTimeout(() => {
      if (!root.querySelector('.scene--game.is-resolving')) return;
      const stamp = document.createElement('span');
      stamp.className = `turn-special-tap turn-special-tap--${beat.kind}`;
      stamp.setAttribute('aria-hidden', 'true');
      stamp.style.left = `${target.left + target.width / 2 + beat.dx}px`;
      stamp.style.top = `${target.top + target.height / 2 + beat.dy}px`;
      root.appendChild(stamp);
      setTimeout(() => stamp.remove(), SPECIAL_CONTACT_MS);
    }, beat.at);
  }
}

function cheerOnSpecial(root,player,kind,delay) {
  if (!['bomb','sweep','ttadak','jjok','bright','double'].includes(kind)) return;
  setTimeout(() => {
    if (!root.querySelector('.scene--game.is-resolving')) return;
    const mascot=root.querySelector(player === 'human' ? '.player-mini-avatar' : '.opponent-avatar');
    if (!mascot) return;
    const className = ['bomb','sweep'].includes(kind) ? 'mascot--big-win' : 'mascot--cheering';
    mascot.classList.remove('mascot--cheering','mascot--big-win');
    void mascot.offsetWidth;
    mascot.classList.add(className);
    setTimeout(() => mascot.classList.remove(className),900);
  },delay);
}

function recoilTable(root, kind, delay) {
  setTimeout(() => {
    if (!root.querySelector('.scene--game.is-resolving')) return;
    const floor = root.querySelector('.field-row');
    const heavy = kind === 'bomb' || kind === 'sweep';
    const distance = heavy ? 7 : 3;
    floor?.animate([
      {transform:'translate3d(0,0,0)',filter:'brightness(1)'},
      {transform:`translate3d(${heavy ? -4 : 0}px,${distance}px,0)`,filter:`brightness(${heavy ? 1.24 : 1.12})`,offset:.28},
      {transform:`translate3d(${heavy ? 4 : 0}px,-${Math.ceil(distance/2)}px,0)`,filter:'brightness(1)',offset:.65},
      {transform:'translate3d(0,0,0)',filter:'brightness(1)'}
    ],{duration:heavy ? 335 : 225,easing:'ease-out'});
  }, delay);
}

export function animateResolvedTurn({ root, result, player, handRect, deckRect, cardHTML, sound, playedMatchId }) {
  const cue = turnCue(result);
  if (!cue || !root) return 0;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const floorIds = [...root.querySelectorAll('.floor-area [data-card]')].map(element => element.dataset.card);
  const pairings = resolveTurnLandings(cue.played, cue.drawn, floorIds, cue.capturedIds, { playedMatchId, ppeok:result.ppeok, bomb:cue.visualKind === 'bomb' });
  const target = sceneTarget(root, cue, pairings.playedFloorId);
  if (reduced || !target || typeof Element.prototype.animate !== 'function') {
    sound(cue.impact);
    return 0;
  }
  const playingHand = cue.played && root.querySelector(`.my-hand [data-card="${cue.played}"]`);
  const humanHand = [...root.querySelectorAll('.my-hand [data-card]')];
  const bombThrows = cue.visualKind === 'bomb'
    ? bombFlightCardIds(cue.played,cue.capturedIds,player === 'human' ? humanHand.map(element => element.dataset.card) : [],floorIds)
    : cue.played ? [cue.played] : [];
  if (playingHand && player === 'human') playingHand.classList.add('hwatu--departing');
  // After the matched cards join, the flight sprite becomes a capture sprite.
  const playedGetsCaptured = cue.capturedIds.includes(cue.played);
  const playedFloorCard = pairings.playedFloorId ? root.querySelector(`.floor-area [data-card="${pairings.playedFloorId}"]`) : null;
  const hasPlayedMatch = !!playedFloorCard;
  const playedTarget = stackedLandingRect(target, hasPlayedMatch);
  const throwGap = bombThrows.length > 1
    ? Math.min(65, Math.floor((TURN_STAGES.draw - TURN_STAGES.land - 16) / (bombThrows.length - 1))) : 0;
  spawnSpecialContacts(root, target, specialContactBeats(cue.visualKind, bombThrows.length, throwGap));
  bombThrows.forEach((id,index) => {
    const handCard = player === 'human' ? humanHand.find(element => element.dataset.card === id) : null;
    if (index && handCard) handCard.classList.add('hwatu--departing');
    const source = handCard ? motionOrigin(handCard) : handRect;
    const landing = index ? {
      ...playedTarget, left:playedTarget.left + (index % 2 ? -5 : 5),
      top:playedTarget.top - index * 3
    } : playedTarget;
    spawnFlight(root,id,source,landing,index*throwGap,cardHTML,
      player === 'computer',false,playedGetsCaptured ? TURN_STAGES.collect - 10 : TURN_PRESENTATION_MS);
    if (index) setTimeout(() => sound('pair'), TURN_STAGES.land + index*throwGap + 8);
  });
  if (playedFloorCard) spawnPairContact(root,playedFloorCard,target,TURN_STAGES.land);
  let drawnTarget = target;
  if (cue.drawn) {
    const deck = deckRect || motionOrigin(root.querySelector('.deck-pile .hwatu'));
    const drawnFloorCard = pairings.drawnFloorId ? root.querySelector(`.floor-area [data-card="${pairings.drawnFloorId}"]`) : null;
    drawnTarget = drawnFloorCard
      ? stackedLandingRect(measure(drawnFloorCard),true)
      : pairings.drawnOnPlayed ? stackedLandingRect(playedTarget,true)
      : freeFloorTarget(root,hasPlayedMatch ? [] : [playedTarget]) || { ...target, left: target.left + 16, top: target.top + 6 };
    pulseDeck(root,TURN_STAGES.draw-45);
    spawnFlight(root, cue.drawn, deck, drawnTarget, TURN_STAGES.draw, cardHTML, false, true);
    spawnFlip(root, cue.drawn, drawnTarget, TURN_STAGES.flip, cardHTML);
    spawnImpact(root, drawnTarget, '탁!', TURN_STAGES.flip + 15);
    if (drawnFloorCard) spawnPairContact(root,drawnFloorCard,measure(drawnFloorCard),TURN_STAGES.flip+25,true);
  }
  spawnImpact(root, target, hasPlayedMatch ? '착!' : '탁!', TURN_STAGES.land);
  recoilTable(root,'land',TURN_STAGES.land+20);
  if (cue.captures || cue.impact === 'special' || result.ppeok) {
    spawnImpact(root, target, specialMoment(cue.visualKind,cue.text).title, TURN_STAGES.collect + 10, cue.visualKind);
  }
  if (['bomb','sweep'].includes(cue.visualKind)) recoilTable(root,cue.visualKind,TURN_STAGES.collect+16);
  cheerOnSpecial(root,player,cue.visualKind,TURN_STAGES.collect+20);
  setTimeout(() => sound(hasPlayedMatch ? 'pair' : 'land'), TURN_STAGES.land + 20);
  if (cue.drawn) setTimeout(() => sound('flip'), TURN_STAGES.flip + 10);
  if (cue.soundKind) setTimeout(() => sound(cue.soundKind), TURN_STAGES.collect + 30);
  if (cue.capturedIds.length) spawnCaptureSweep(root, cue.capturedIds, target, drawnTarget, cue, player, result, cardHTML, sound);
  else if (cue.impact === 'special' && !cue.soundKind) setTimeout(() => sound('special'), TURN_STAGES.collect + 10);
  if (cue.capturedIds.length) setTimeout(() => {
    if (!root.isConnected) return;
    for (const tile of root.querySelectorAll('.floor-area [data-card]')) {
      if (cue.capturedIds.includes(tile.dataset.card)) tile.classList.add('hwatu--departing');
    }
  },TURN_STAGES.collect);
  if (player === 'human' && navigator.vibrate) {
    setTimeout(() => navigator.vibrate?.(hasPlayedMatch ? [12,25,13] : 12), TURN_STAGES.land + 15);
    const specialHaptic = {bomb:[24,35,28],ppeok:35,sweep:[9,18,9,18,16],bright:[8,24,8],double:[9,20,9],ttadak:[8,15,8]};
    if (cue.captures || cue.soundKind) setTimeout(()=>navigator.vibrate?.(specialHaptic[cue.visualKind] || [10,35,14]), TURN_STAGES.collect + 250);
  }
  return TURN_PRESENTATION_MS;
}
