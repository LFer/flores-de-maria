export type FioFlowerContext = 'home' | 'order_created' | 'general';

export type FioFlower = {
  id: string;
  text: string;
  context: FioFlowerContext;
  active: boolean;
};

export const fioFlowers = [
  {
    id: 'fio_001',
    text: 'Fío, Felipe está orgulloso de vos.',
    context: 'home',
    active: true,
  },
  {
    id: 'fio_002',
    text: 'Una florecita para recordarte que sos profundamente amada.',
    context: 'general',
    active: true,
  },
  {
    id: 'fio_003',
    text: 'Lo que hacés con amor embellece la parroquia y también el corazón de Felipe.',
    context: 'order_created',
    active: true,
  },
  {
    id: 'fio_004',
    text: 'Fío, tu ternura también construye cosas grandes.',
    context: 'home',
    active: true,
  },
  {
    id: 'fio_005',
    text: 'Pequeño recordatorio: Felipe te ama.',
    context: 'general',
    active: true,
  },
  {
    id: 'fio_006',
    text: 'Esta app también tiene una flor escondida para vos.',
    context: 'order_created',
    active: true,
  },
] as const satisfies readonly FioFlower[];
