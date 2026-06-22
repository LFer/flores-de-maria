import AsyncStorage from '@react-native-async-storage/async-storage';
import { fioFlowers, type FioFlower, type FioFlowerContext } from '../data/fioFlowers';
import { passesSpiritualFlowerProbability } from './spiritualFlowers';

export const FIO_UID = '2BmBx4r2PuZoIm6NKUJn6mpyvUW2';

const DAILY_KEY_PREFIX = '@flores_de_maria/fio_flower/';

function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFioUser(uid: string | null | undefined): boolean {
  return uid === FIO_UID;
}

export function getFioFlowerCandidates(
  context: FioFlowerContext,
  flowers: readonly FioFlower[] = fioFlowers,
): FioFlower[] {
  return flowers.filter((flower) => flower.active === true && (flower.context === context || flower.context === 'general'));
}

function pickFioFlower(candidates: readonly FioFlower[], rng: () => number): FioFlower | null {
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)] ?? null;
}

export async function maybeGetDailyFioFlower(
  uid: string | null | undefined,
  context: FioFlowerContext,
  probability: number,
  options: {
    rng?: () => number;
    date?: Date;
    flowers?: readonly FioFlower[];
  } = {},
): Promise<FioFlower | null> {
  if (!isFioUser(uid)) return null;

  const rng = options.rng ?? Math.random;
  const storageKey = `${DAILY_KEY_PREFIX}${context}`;
  const today = todayKey(options.date);

  try {
    const lastShown = await AsyncStorage.getItem(storageKey);
    if (lastShown === today) return null;
  } catch (error) {
    console.error('[fioFlowers] failed to read daily limit', error);
    return null;
  }

  if (!passesSpiritualFlowerProbability(probability, rng)) return null;

  const flower = pickFioFlower(getFioFlowerCandidates(context, options.flowers), rng);
  if (!flower) return null;

  try {
    await AsyncStorage.setItem(storageKey, today);
  } catch (error) {
    console.error('[fioFlowers] failed to store daily limit', error);
    return null;
  }

  return flower;
}
