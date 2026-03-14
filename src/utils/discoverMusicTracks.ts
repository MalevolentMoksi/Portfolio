/**
 * Music Track Discovery Utility
 * Automatically discovers all .m4a and .mp3 files in the public/assets/music/ directory
 */

export function discoverMusicTracks(): string[] {
  // Use Vite's import.meta.glob to discover all music files at build time
  const musicFiles: Record<string, unknown> = import.meta.glob(
    '../../public/assets/music/*.{m4a,mp3}',
    {
      query: '?url',
      import: 'default',
    }
  );

  // Extract filenames from the glob paths
  const trackNames = Object.keys(musicFiles)
    .map((path) => path.split('/').pop()!)
    .sort();

  return trackNames;
}

export default discoverMusicTracks;
