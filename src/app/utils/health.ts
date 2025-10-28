import { Pet } from '../models/pet.model';

export type HealthTier = 'unhealthy' | 'very-healthy' | 'healthy';

type HealthCalculator = (p: Pet) => HealthTier;

const toNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const defaultCalculator: HealthCalculator = (p) => {
  const kind = (p.kind || '').toLowerCase();
  if (kind.includes('cat') && p.number_of_lives === 1) return 'unhealthy';

  const weight = toNum(p.weight);
  const height = toNum(p.height);
  const length = toNum(p.length);

  if (!weight || !height || !length || height === 0 || length === 0) return 'unhealthy';

  const ratio = weight / (height * length);

  if (ratio < 2 || ratio > 5) return 'unhealthy';
  if (ratio >= 2 && ratio < 3) return 'very-healthy';
  return 'healthy';
};

const calculators = new Map<string, HealthCalculator>([]);

export function computeHealth(p: Pet): HealthTier {
  const kind = (p.kind || '').toLowerCase();
  for (const [key, calc] of calculators.entries()) {
    if (kind === key || kind.includes(key)) {
      return safeRun(calc, p);
    }
  }
  return safeRun(defaultCalculator, p);
}

function safeRun(calc: HealthCalculator, p: Pet): HealthTier {
  try {
    return calc(p);
  } catch {
    return 'unhealthy';
  }
}
