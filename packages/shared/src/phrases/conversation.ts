import type { Lang } from '../protocol.js';
import type { Phrase } from './types.js';

/**
 * The stranger-facing intro card shown when handing the phone over for the
 * first time. Warm-polite usted register.
 */
export const SPANISH_INTRO: Record<Lang, string> = {
  es: 'Hola. Estoy usando esta aplicación para que podamos hablar. Cuando sea su turno, toque el botón y hable — sus palabras me aparecerán en inglés. Muchas gracias por su paciencia.',
  en: 'Hi. I’m using this app so we can talk. When it’s your turn, tap the button and speak — your words will appear for me in English. Thank you for your patience.',
};

/** Tap-to-reply chips available in every conversation. */
export const QUICK_REPLIES: Phrase[] = [
  { id: 'qr-yes', es: 'Sí, gracias.', en: 'Yes, thank you.', category: 'reply' },
  { id: 'qr-no', es: 'No, gracias.', en: 'No, thank you.', category: 'reply' },
  {
    id: 'qr-understood',
    es: 'Entendido, muchas gracias.',
    en: 'Understood, thank you very much.',
    category: 'reply',
  },
  {
    id: 'qr-repeat',
    es: '¿Me lo puede repetir, por favor?',
    en: 'Could you repeat that, please?',
    category: 'clarify',
  },
  {
    id: 'qr-slower',
    es: '¿Puede hablar más despacio, por favor?',
    en: 'Could you speak more slowly, please?',
    category: 'clarify',
  },
  {
    id: 'qr-moment',
    es: 'Un momento, por favor.',
    en: 'One moment, please.',
    category: 'reply',
  },
];
