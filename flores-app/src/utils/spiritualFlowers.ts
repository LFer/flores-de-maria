import AsyncStorage from '@react-native-async-storage/async-storage';
import { spiritualFlowers, type SpiritualFlower } from '../data/spiritualFlowers';

export type SpiritualFlowerContext = 'home' | 'order_created' | 'parish_delivery';

const DAILY_KEY_PREFIX = '@flores_de_maria/spiritual_flower/';

function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSpiritualFlowerCandidates(
  context: SpiritualFlowerContext,
  flowers: readonly SpiritualFlower[] = spiritualFlowers,
): SpiritualFlower[] {
  return flowers.filter((flower) => flower.active === true && (flower.context === context || flower.context === 'general'));
}

export function pickWeightedSpiritualFlower(
  candidates: readonly SpiritualFlower[],
  rng: () => number = Math.random,
): SpiritualFlower | null {
  const weighted = candidates
    .map((flower) => ({ flower, weight: Math.max(0, flower.weight) }))
    .filter(({ weight }) => weight > 0);

  const total = weighted.reduce((sum, { weight }) => sum + weight, 0);
  if (total <= 0) return null;

  let cursor = rng() * total;
  for (const { flower, weight } of weighted) {
    cursor -= weight;
    if (cursor < 0) return flower;
  }

  return weighted[weighted.length - 1]?.flower ?? null;
}

export function passesSpiritualFlowerProbability(probability: number, rng: () => number = Math.random): boolean {
  return rng() < Math.max(0, Math.min(1, probability));
}

export async function maybeGetDailySpiritualFlower(
  context: SpiritualFlowerContext,
  probability: number,
  options: {
    rng?: () => number;
    date?: Date;
    flowers?: readonly SpiritualFlower[];
  } = {},
): Promise<SpiritualFlower | null> {
  const rng = options.rng ?? Math.random;
  const storageKey = `${DAILY_KEY_PREFIX}${context}`;
  const today = todayKey(options.date);

  try {
    const lastShown = await AsyncStorage.getItem(storageKey);
    if (lastShown === today) return null;
  } catch (error) {
    console.error('[spiritualFlowers] failed to read daily limit', error);
    return null;
  }

  if (!passesSpiritualFlowerProbability(probability, rng)) return null;

  const flower = pickWeightedSpiritualFlower(getSpiritualFlowerCandidates(context, options.flowers), rng);
  if (!flower) return null;

  try {
    await AsyncStorage.setItem(storageKey, today);
  } catch (error) {
    console.error('[spiritualFlowers] failed to store daily limit', error);
    return null;
  }

  return flower;
}
