
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Max file size for client-side base64 handling. 
// Reduced to 50MB to prevent browser crash during Base64 conversion in the main thread.
export const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024; 

// FFmpeg Configuration
// We use specific versions to ensure compatibility.
// @ffmpeg/core (Single Threaded) vs @ffmpeg/core-mt (Multi Threaded)
// We use the Single-Threaded version to avoid SharedArrayBuffer requirements which fail in many environments.
const CORE_VERSION = '0.12.6';
const FFMPEG_VERSION = '0.12.10'; // Use a stable version for the worker

// Note: unpkg.com/@ffmpeg/core points to the Single Threaded version in 0.12.x
// unpkg.com/@ffmpeg/core-mt would be the Multi Threaded version.
export const FF_CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm/ffmpeg-core.js`;
export const FF_WASM_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm/ffmpeg-core.wasm`;
export const FF_WORKER_URL = `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm/worker.js`;
