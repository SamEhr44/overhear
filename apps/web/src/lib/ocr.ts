'use client';

/**
 * Screenshot → text via Tesseract.js, loaded lazily on first use (the wasm
 * core + Spanish/English models are a multi-MB download — never paid unless
 * the feature is used). Online-only, which is honest: the translation step
 * needs the network anyway.
 */
export async function recognizeImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['spa', 'eng'], undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
