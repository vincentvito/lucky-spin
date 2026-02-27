export interface PrizeForLottery {
  id: string;
  name: string;
  probability: number;
  total_quantity: number | null;
  awarded_count: number;
}

export interface LotteryResult {
  won: boolean;
  prizeId: string | null;
  prizeName: string | null;
  segmentIndex: number;
}

export function determineLotteryOutcome(
  prizes: PrizeForLottery[],
  totalSegments: number
): LotteryResult {
  const random = Math.random();
  let cumulative = 0;

  // Filter out prizes that have exhausted their quantity
  const availablePrizes = prizes.filter(
    (p) => p.total_quantity === null || p.awarded_count < p.total_quantity
  );

  for (const prize of availablePrizes) {
    cumulative += prize.probability;
    if (random < cumulative) {
      // Prize segments are at even indices (0, 2, 4, ...)
      const prizeIndex = prizes.findIndex((p) => p.id === prize.id);
      const segmentIndex = prizeIndex * 2;

      return {
        won: true,
        prizeId: prize.id,
        prizeName: prize.name,
        segmentIndex,
      };
    }
  }

  // No win — pick a random "no win" segment (odd indices)
  const noWinSegments: number[] = [];
  for (let i = 0; i < totalSegments; i++) {
    if (i % 2 === 1) noWinSegments.push(i);
  }
  const segmentIndex =
    noWinSegments[Math.floor(Math.random() * noWinSegments.length)];

  return { won: false, prizeId: null, prizeName: null, segmentIndex };
}
