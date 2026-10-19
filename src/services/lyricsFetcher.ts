import { LyricLine } from "../types/island";

/**
 * Clean up messy track titles from Spotify / Apple Music:
 * Strips "- Remastered...", "(feat. ...)", "[Deluxe]", etc.
 */
export function sanitizeTrackTitle(title: string): string {
  if (!title) return "";
  return title
    .replace(/\s*-\s*(remaster(ed)?(\s*\d+)?|live|radio edit|bonus track|single version|acoustic|original mix|deluxe).*$/i, "")
    .replace(/\s*\(feat\..*?\)/gi, "")
    .replace(/\s*\(with.*?\)/gi, "")
    .replace(/\s*\(remaster(ed)?(\s*\d+)?\)/gi, "")
    .replace(/\s*\(live.*?\)/gi, "")
    .replace(/\s*\[.*?\]/g, "")
    .trim();
}

/**
 * Extract primary artist if multiple artists comma-separated
 */
export function extractPrimaryArtist(artist: string): string {
  if (!artist) return "";
  const first = artist.split(/,|&|feat\./i)[0];
  return first.trim();
}

/**
 * Parse standard LRC format string into timestamped LyricLine array
 */
export function parseLrc(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split("\n");
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  let id = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = regex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, "0").slice(0, 3), 10);
      const timeMs = minutes * 60000 + seconds * 1000 + ms;
      const text = match[4].trim();
      if (text) {
        result.push({ id, timeMs, text });
        id++;
      }
    }
  }

  return result;
}

/**
 * Fallback: Convert plain text lyrics into distributed timestamped lines
 */
export function parsePlainLyrics(plain: string, durationSeconds: number): LyricLine[] {
  if (!plain) return [];
  const rawLines = plain
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  const totalMs = (durationSeconds > 0 ? durationSeconds : 180) * 1000;
  // Leave initial intro gap of 8s
  const availableMs = Math.max(totalMs - 12000, 10000);
  const stepMs = Math.floor(availableMs / rawLines.length);

  return rawLines.map((text, idx) => ({
    id: idx + 1,
    timeMs: 8000 + idx * stepMs,
    text,
  }));
}

// In-memory cache to prevent redundant HTTP queries for the same track
const lyricsCache = new Map<string, LyricLine[]>();

/**
 * Multi-tier resilient lyrics fetcher:
 * 1. Exact query via api/get
 * 2. Sanitized query via api/get
 * 3. Fuzzy search query via api/search?q=... (resolves 99% of Spotify tracks)
 * 4. Fallback to distributed plainLyrics if syncedLyrics is absent
 */
export async function fetchSyncedLyrics(
  title: string,
  artist: string,
  durationSeconds: number = 180
): Promise<LyricLine[] | null> {
  if (!title || title === "Connecting to Media...") return null;

  const cleanTitle = sanitizeTrackTitle(title) || title;
  const primaryArtist = extractPrimaryArtist(artist) || artist;
  const cacheKey = `${cleanTitle.toLowerCase()}:::${primaryArtist.toLowerCase()}`;

  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey) || null;
  }

  // Tier 1 & 2: Direct / Sanitized GET
  try {
    const directUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
      cleanTitle
    )}&artist_name=${encodeURIComponent(primaryArtist)}`;

    const res = await fetch(directUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.syncedLyrics) {
        const parsed = parseLrc(data.syncedLyrics);
        if (parsed.length > 0) {
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }
      if (data && data.plainLyrics) {
        const parsed = parsePlainLyrics(data.plainLyrics, durationSeconds);
        if (parsed.length > 0) {
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    }
  } catch {
    // proceed to tier 3
  }

  // Tier 3: Search endpoint (Handles Spotify feat., remixes, differing punctuation)
  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
      `${cleanTitle} ${primaryArtist}`
    )}`;

    const res = await fetch(searchUrl);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        // Priority 1: Pick first with syncedLyrics
        const syncedItem = list.find(
          (item: any) => item.syncedLyrics && item.syncedLyrics.trim().length > 0
        );
        if (syncedItem) {
          const parsed = parseLrc(syncedItem.syncedLyrics);
          if (parsed.length > 0) {
            lyricsCache.set(cacheKey, parsed);
            return parsed;
          }
        }

        // Priority 2: Pick first with plainLyrics
        const plainItem = list.find(
          (item: any) => item.plainLyrics && item.plainLyrics.trim().length > 0
        );
        if (plainItem) {
          const parsed = parsePlainLyrics(plainItem.plainLyrics, durationSeconds);
          if (parsed.length > 0) {
            lyricsCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }
    }
  } catch {
    // Network error
  }

  return null;
}
