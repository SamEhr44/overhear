import type { PhrasePack } from './types.js';

export const HOTEL_PACK: PhrasePack = {
  id: 'hotel',
  title: { en: 'Hotel', es: 'Hotel' },
  tagline: { en: 'Check-in, requests, help', es: 'Registro, peticiones, ayuda' },
  phrases: [
    {
      id: 'hotel-reservation',
      es: 'Tengo una reservación a nombre de…',
      en: 'I have a reservation under the name…',
      category: 'check-in',
    },
    {
      id: 'hotel-checkout-time',
      es: '¿A qué hora es la salida?',
      en: 'What time is check-out?',
      category: 'check-in',
    },
    {
      id: 'hotel-ac',
      es: 'El aire acondicionado no funciona, ¿me pueden ayudar?',
      en: 'The air conditioning isn’t working — could you help me?',
      category: 'requests',
    },
    {
      id: 'hotel-towels',
      es: '¿Me pueden traer más toallas, por favor?',
      en: 'Could you bring more towels, please?',
      category: 'requests',
    },
    {
      id: 'hotel-safe',
      es: '¿Hay caja fuerte en la habitación?',
      en: 'Is there a safe in the room?',
      category: 'requests',
    },
    {
      id: 'hotel-taxi',
      es: '¿Me puede pedir un taxi, por favor?',
      en: 'Could you call me a taxi, please?',
      category: 'help',
    },
    {
      id: 'hotel-late-checkout',
      es: '¿Sería posible una salida más tarde?',
      en: 'Would a late check-out be possible?',
      category: 'requests',
    },
  ],
};
