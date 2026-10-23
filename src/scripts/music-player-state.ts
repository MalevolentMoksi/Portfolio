/**
 * Music Player saved-position restore (pure, no DOM / audio).
 */

export interface SavedTrackState {
  /** Filename saved by current builds (`music-currentTrackFile`). */
  file: string | null;
  /** Index saved by older builds (`music-currentTrack`). */
  index: string | null;
  /** Playback position in seconds (`music-currentTime`). */
  time: string | null;
}

export interface RestoredTrack {
  /** Index to resume, or null to keep the player's default track. */
  trackIndex: number | null;
  /** Position to resume from; 0 unless it belongs to the restored track. */
  time: number;
}

/**
 * Resolves where playback should resume. The track is matched by filename: the list
 * is sorted alphabetically, so adding a file shifts indices and an index alone would
 * resume another song at the old position.
 */
export const restoreSavedTrack = (
  trackFiles: readonly string[],
  saved: SavedTrackState
): RestoredTrack => {
  let trackIndex: number | null = null;

  if (saved.file !== null) {
    const fileIndex = trackFiles.indexOf(saved.file);
    if (fileIndex >= 0) trackIndex = fileIndex;
  } else {
    // State saved before filenames were stored: trust the index once.
    const legacyIndex = parseInt(saved.index ?? '', 10);
    if (!isNaN(legacyIndex) && legacyIndex >= 0 && legacyIndex < trackFiles.length) {
      trackIndex = legacyIndex;
    }
  }

  const time = parseFloat(saved.time ?? '');
  return {
    trackIndex,
    time: trackIndex !== null && !isNaN(time) && time >= 0 ? time : 0,
  };
};
