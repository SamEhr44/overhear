import type { PhrasePack } from './types.js';

export const SHOPPING_PACK: PhrasePack = {
  id: 'shopping',
  title: { en: 'Shopping', es: 'Compras' },
  tagline: { en: 'Prices, sizes, paying', es: 'Precios, tallas, pago' },
  phrases: [
    {
      id: 'shop-price',
      es: '¿Cuánto cuesta, por favor?',
      en: 'How much is it, please?',
      category: 'price',
    },
    {
      id: 'shop-looking',
      es: 'Solo estoy mirando, gracias.',
      en: 'I’m just looking, thank you.',
      category: 'courtesy',
    },
    {
      id: 'shop-size',
      es: '¿Lo tiene en otra talla?',
      en: 'Do you have it in another size?',
      category: 'fit',
    },
    {
      id: 'shop-try',
      es: '¿Me lo puedo probar?',
      en: 'May I try it on?',
      category: 'fit',
    },
    {
      id: 'shop-take-it',
      es: 'Me lo llevo, por favor.',
      en: 'I’ll take it, please.',
      category: 'pay',
    },
    {
      id: 'shop-card',
      es: '¿Puedo pagar con tarjeta?',
      en: 'Can I pay by card?',
      category: 'pay',
    },
    {
      id: 'shop-bag',
      es: '¿Me da una bolsa, por favor?',
      en: 'Could I have a bag, please?',
      category: 'pay',
    },
  ],
};
