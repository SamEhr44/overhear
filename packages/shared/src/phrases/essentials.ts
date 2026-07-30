import type { PhrasePack } from './types.js';

/**
 * SOS / Essentials board — high-stakes phrases, tap-to-play, fully offline
 * (bundled text + on-device speech synthesis). Usted register.
 */
export const ESSENTIALS_PACK: PhrasePack = {
  id: 'essentials',
  title: { en: 'Essentials', es: 'Esenciales' },
  tagline: { en: 'Emergency & help', es: 'Emergencia y ayuda' },
  phrases: [
    {
      id: 'sos-help',
      es: '¡Ayuda, por favor!',
      en: 'Help, please!',
      category: 'emergency',
    },
    {
      id: 'sos-emergency',
      es: 'Es una emergencia.',
      en: 'It’s an emergency.',
      category: 'emergency',
    },
    {
      id: 'sos-doctor',
      es: 'Necesito un médico, por favor.',
      en: 'I need a doctor, please.',
      category: 'medical',
    },
    {
      id: 'sos-ambulance',
      es: 'Llame a una ambulancia, por favor.',
      en: 'Call an ambulance, please.',
      category: 'medical',
    },
    {
      id: 'sos-hospital',
      es: '¿Dónde está el hospital más cercano?',
      en: 'Where is the nearest hospital?',
      category: 'medical',
    },
    {
      id: 'sos-police',
      es: 'Llame a la policía, por favor.',
      en: 'Call the police, please.',
      category: 'police',
    },
    {
      id: 'sos-robbed',
      es: 'Me robaron.',
      en: 'I’ve been robbed.',
      category: 'police',
    },
    {
      id: 'sos-no-spanish',
      es: 'No hablo español. ¿Habla usted inglés?',
      en: 'I don’t speak Spanish. Do you speak English?',
      category: 'help',
    },
    {
      id: 'sos-lost',
      es: 'Me perdí. ¿Me puede ayudar?',
      en: 'I’m lost. Can you help me?',
      category: 'help',
    },
  ],
};
