import type { PhrasePack } from './types.js';

/** Driver deck — tap-to-play phrases for taxis and rideshares (usted register). */
export const RIDE_PACK: PhrasePack = {
  id: 'ride',
  title: { en: 'Driver phrases', es: 'Frases para el conductor' },
  tagline: { en: 'Taxi & rideshare', es: 'Taxi y viajes' },
  phrases: [
    {
      id: 'ride-how-much-there',
      es: '¿Cuánto cuesta hasta allá?',
      en: 'How much to get there?',
      category: 'price',
    },
    {
      id: 'ride-meter',
      es: '¿Puede encender el taxímetro, por favor?',
      en: 'Could you turn on the meter, please?',
      category: 'price',
    },
    {
      id: 'ride-airport',
      es: 'Voy al aeropuerto, por favor.',
      en: 'I’m going to the airport, please.',
      category: 'destination',
    },
    {
      id: 'ride-here-fine',
      es: 'Aquí está bien, gracias.',
      en: 'Here is fine, thank you.',
      category: 'during',
    },
    {
      id: 'ride-stop-here',
      es: 'Pare aquí, por favor.',
      en: 'Stop here, please.',
      category: 'during',
    },
    {
      id: 'ride-wait',
      es: '¿Me puede esperar cinco minutos, por favor?',
      en: 'Could you wait five minutes for me, please?',
      category: 'during',
    },
    {
      id: 'ride-owe',
      es: '¿Cuánto le debo?',
      en: 'How much do I owe you?',
      category: 'price',
    },
    {
      id: 'ride-card',
      es: '¿Acepta tarjeta?',
      en: 'Do you take cards?',
      category: 'price',
    },
  ],
};
