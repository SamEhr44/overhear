import type { PhrasePack } from './types.js';

export const RESTAURANT_PACK: PhrasePack = {
  id: 'restaurant',
  title: { en: 'Restaurant', es: 'Restaurante' },
  tagline: { en: 'Order, ask, pay', es: 'Pedir, preguntar, pagar' },
  phrases: [
    {
      id: 'rest-table',
      es: 'Una mesa para dos, por favor.',
      en: 'A table for two, please.',
      category: 'order',
    },
    {
      id: 'rest-recommend',
      es: '¿Qué me recomienda?',
      en: 'What do you recommend?',
      category: 'order',
    },
    {
      id: 'rest-no-cilantro',
      es: 'Sin cilantro, por favor.',
      en: 'No cilantro, please.',
      category: 'order',
    },
    {
      id: 'rest-allergy',
      es: 'Tengo alergia a los cacahuates. ¿Este platillo los lleva?',
      en: 'I’m allergic to peanuts. Does this dish have any?',
      category: 'safety',
    },
    {
      id: 'rest-water',
      es: 'Un agua embotellada, por favor.',
      en: 'A bottled water, please.',
      category: 'order',
    },
    {
      id: 'rest-check',
      es: 'La cuenta, por favor.',
      en: 'The check, please.',
      category: 'pay',
    },
    {
      id: 'rest-card',
      es: '¿Aceptan tarjeta?',
      en: 'Do you take cards?',
      category: 'pay',
    },
    {
      id: 'rest-delicious',
      es: 'Todo estuvo delicioso, muchas gracias.',
      en: 'Everything was delicious, thank you so much.',
      category: 'courtesy',
    },
  ],
};
