import { describe, it, expect } from 'vitest';
import { restoreSavedTrack } from '@/scripts/music-player-state';

const TRACKS = ['alpha.mp3', 'bravo.mp3', 'charlie.mp3'];

describe('restoreSavedTrack', () => {
  it('resumes the saved song even after a track was added before it', () => {
    // "aardvark.mp3" sorts first and shifts every index by one.
    const restored = restoreSavedTrack(['aardvark.mp3', ...TRACKS], {
      file: 'bravo.mp3',
      index: '1',
      time: '42',
    });
    expect(restored).toEqual({ trackIndex: 2, time: 42 });
  });

  it('starts from zero when the saved song no longer exists', () => {
    const restored = restoreSavedTrack(TRACKS, { file: 'removed.mp3', index: '1', time: '42' });
    expect(restored).toEqual({ trackIndex: null, time: 0 });
  });

  it('still honours an index saved by older builds', () => {
    const restored = restoreSavedTrack(TRACKS, { file: null, index: '2', time: '12' });
    expect(restored).toEqual({ trackIndex: 2, time: 12 });
  });

  it('ignores an out-of-range legacy index and its position', () => {
    const restored = restoreSavedTrack(TRACKS, { file: null, index: '7', time: '12' });
    expect(restored).toEqual({ trackIndex: null, time: 0 });
  });

  it('starts fresh on a first visit', () => {
    expect(restoreSavedTrack(TRACKS, { file: null, index: null, time: null })).toEqual({
      trackIndex: null,
      time: 0,
    });
  });
});
