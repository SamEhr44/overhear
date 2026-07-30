'use client';

import { SPANISH_INTRO } from '@overhear/shared';
import { speak } from '@/lib/tts';

/**
 * Stranger-facing hand-off card: explains the app in warm usted Spanish,
 * plays aloud, and clears with one tap. English gloss underneath for me.
 */
export function IntroCard({ onDone }: { onDone: () => void }) {
  return (
    <div className="rounded-card border border-line bg-card px-[15px] py-4">
      <p lang="es" className="text-[20px] leading-[1.45] font-bold text-ink">
        {SPANISH_INTRO.es}
      </p>
      <p className="mt-2 text-[13px] leading-[1.45] font-medium text-ink-3">{SPANISH_INTRO.en}</p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void speak(SPANISH_INTRO.es, 'es')}
          className="rounded-chip border border-line bg-card px-[13px] py-2.5 text-[14px] leading-none font-bold text-ink transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          ▸ Escuchar
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-chip bg-accent px-[13px] py-2.5 text-[15px] leading-none font-extrabold text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
