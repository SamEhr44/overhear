import type { PhrasePack } from './types.js';

/** Directions situation pack — the reference pack the others follow. */
export const DIRECTIONS_PACK: PhrasePack = {
  id: 'directions',
  title: { en: 'Directions', es: 'Direcciones' },
  tagline: { en: 'Find your way', es: 'Encuentre el camino' },
  phrases: [
    {
      id: 'dir-where-is',
      es: '¿Me puede decir dónde está…?',
      en: 'Can you tell me where … is?',
      category: 'directions',
    },
    {
      id: 'dir-how-far',
      es: '¿Qué tan lejos queda?',
      en: 'How far is it?',
      category: 'directions',
    },
    {
      id: 'dir-walkable',
      es: '¿Se puede ir caminando?',
      en: 'Can I walk there?',
      category: 'directions',
    },
    {
      id: 'dir-show-map',
      es: '¿Me lo puede señalar en el mapa, por favor?',
      en: 'Could you point it out on the map, please?',
      category: 'directions',
    },
    {
      id: 'dir-left-right',
      es: '¿A la izquierda o a la derecha?',
      en: 'To the left or to the right?',
      category: 'clarify',
    },
    {
      id: 'cl-slower',
      es: '¿Puede hablar más despacio, por favor?',
      en: 'Could you speak more slowly, please?',
      category: 'clarify',
    },
    {
      id: 'cl-repeat',
      es: '¿Me lo puede repetir, por favor?',
      en: 'Could you repeat that, please?',
      category: 'clarify',
    },
    {
      id: 'co-thanks',
      es: 'Muchas gracias, muy amable.',
      en: 'Thank you so much, very kind of you.',
      category: 'courtesy',
    },
  ],
};
