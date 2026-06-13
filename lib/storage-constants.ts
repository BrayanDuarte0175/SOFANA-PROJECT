// Constantes compartidas entre cliente y servidor (sin secretos).

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB (límite del bucket)
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024; // 100 MB (bucket music)

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/m4a",
  "audio/webm",
  "audio/3gpp",
];
