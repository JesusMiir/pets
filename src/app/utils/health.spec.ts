import { computeHealth, type HealthTier } from './health';

type AnyPet = {
  kind: string;
  weight?: number;
  height?: number;
  length?: number;
  number_of_lives?: number;
};

const p = (over: Partial<AnyPet>): AnyPet => ({
  kind: 'dog',
  weight: 5000,
  height: 50,
  length: 50,
  ...over,
});

describe('computeHealth', () => {
  it('cat with one life is unhealthy regardless of ratio', () => {
    const pet = p({ kind: 'cat', number_of_lives: 1, weight: 4000, height: 40, length: 40 });
    expect(computeHealth(pet as any)).toBe('unhealthy');
  });

  it('ratio < 2 => unhealthy', () => {
    const pet = p({ weight: 3000, height: 50, length: 40 });
    expect(computeHealth(pet as any)).toBe('unhealthy');
  });

  it('2 ≤ ratio < 3 => very-healthy (lower bound)', () => {
    const pet = p({ weight: 4000, height: 50, length: 40 });
    expect(computeHealth(pet as any)).toBe('very-healthy');
  });

  it('2 ≤ ratio < 3 => very-healthy (upper open bound)', () => {
    const pet = p({ weight: 5999.9, height: 50, length: 40 });
    expect(computeHealth(pet as any)).toBe('very-healthy');
  });

  it('3 ≤ ratio ≤ 5 => healthy (lower bound)', () => {
    const pet = p({ weight: 6000, height: 50, length: 40 });
    expect(computeHealth(pet as any)).toBe('healthy');
  });

  it('3 ≤ ratio ≤ 5 => healthy (upper bound)', () => {
    const pet = p({ weight: 10000, height: 50, length: 40 });
    expect(computeHealth(pet as any)).toBe('healthy');
  });

  it('ratio > 5 => unhealthy', () => {
    const pet = p({ weight: 10001, height: 50, length: 40 });
    expect(computeHealth(pet as any)).toBe('unhealthy');
  });

  it('invalid or non-positive dimensions => unhealthy', () => {
    expect(computeHealth(p({ weight: NaN } as any) as any)).toBe('unhealthy');
    expect(computeHealth(p({ height: Infinity } as any) as any)).toBe('unhealthy');
    expect(computeHealth(p({ length: -10 } as any) as any)).toBe('unhealthy');
    expect(computeHealth(p({ height: 0 } as any) as any)).toBe('unhealthy');
    expect(computeHealth(p({ weight: 0 } as any) as any)).toBe('unhealthy');
  });

  it('cats with lives > 1 use normal thresholds', () => {
    expect(
      computeHealth(
        p({ kind: 'cat', number_of_lives: 9, weight: 4000, height: 50, length: 40 }) as any
      )
    ).toBe('very-healthy');
    expect(
      computeHealth(
        p({ kind: 'cat', number_of_lives: 9, weight: 6000, height: 50, length: 40 }) as any
      )
    ).toBe('healthy');
  });
});
