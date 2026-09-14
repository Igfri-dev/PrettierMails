/**
 * Robust YouTube URL parser & asset helper
 */

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern matching:
  // - youtube.com/watch?v=ID
  // - youtube.com/embed/ID
  // - youtu.be/ID
  // - youtube.com/v/ID
  // - youtube.com/shorts/ID
  // - direct 11-char ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  // Check if user just pasted an 11-character ID directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getYouTubeThumbnail(videoId, quality = 'hq') {
  if (!videoId) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
  
  if (quality === 'max') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeWatchUrl(videoId) {
  if (!videoId) return 'https://www.youtube.com';
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeEmbedUrl(videoId) {
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
}
