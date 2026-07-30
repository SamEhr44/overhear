import { DIRECTIONS_PACK } from './directions.js';
import { HOTEL_PACK } from './hotel.js';
import { RESTAURANT_PACK } from './restaurant.js';
import { SHOPPING_PACK } from './shopping.js';
import type { PhrasePack } from './types.js';

export * from './types.js';
export * from './conversation.js';
export { DIRECTIONS_PACK } from './directions.js';
export { HOTEL_PACK } from './hotel.js';
export { RESTAURANT_PACK } from './restaurant.js';
export { SHOPPING_PACK } from './shopping.js';
export { RIDE_PACK } from './ride.js';
export { ESSENTIALS_PACK } from './essentials.js';

/** Situation packs in chooser order. */
export const ALL_PACKS: PhrasePack[] = [
  DIRECTIONS_PACK,
  RESTAURANT_PACK,
  SHOPPING_PACK,
  HOTEL_PACK,
];

export function getPack(id: string): PhrasePack | undefined {
  return ALL_PACKS.find((p) => p.id === id);
}
