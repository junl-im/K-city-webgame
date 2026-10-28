import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameUuid } from '../engine/gameState';

afterEach(() => vi.unstubAllGlobals());

describe('HTTP 미리보기의 게임 시작 호환', () => {
  it('randomUUID가 없는 브라우저에서는 안전 난수로 버전 4 UUID를 만든다', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        for (let i = 0; i < bytes.length; i++) bytes[i] = i * 11;
        return bytes;
      }
    });
    expect(createGameUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
