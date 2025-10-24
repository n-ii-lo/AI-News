import type { Analysis, Direction } from './schemas';

export interface AggregateResult {
  BTC: { direction: Direction; confidence: number; score: number };
  SOL: { direction: Direction; confidence: number; score: number };
  BNB: { direction: Direction; confidence: number; score: number };
  overall: { bias: 'bullish' | 'bearish' | 'mixed' | 'neutral'; confidence: number };
}

// Convert direction to numeric score
function directionToScore(direction: Direction): number {
  switch (direction) {
    case 'up': return 1;
    case 'down': return -1;
    case 'neutral': return 0;
    default: return 0;
  }
}

// Convert score back to direction
function scoreToDirection(score: number): Direction {
  if (score >= 0.25) return 'up';
  if (score <= -0.25) return 'down';
  return 'neutral';
}

// Calculate weighted score for a coin
function calculateCoinScore(analyses: Analysis[], coin: 'BTC' | 'SOL' | 'BNB'): {
  score: number;
  confidence: number;
  direction: Direction;
} {
  const validAnalyses = analyses.filter(a => 
    a.status === 'done' && 
    a.verdict && 
    a.verdict.coins[coin]
  );

  if (validAnalyses.length === 0) {
    return { score: 0, confidence: 0, direction: 'neutral' };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalConfidence = 0;

  for (const analysis of validAnalyses) {
    const coinImpact = analysis.verdict!.coins[coin];
    const directionScore = directionToScore(coinImpact.direction);
    const weight = coinImpact.confidence;
    
    totalWeightedScore += directionScore * weight;
    totalWeight += weight;
    totalConfidence += coinImpact.confidence;
  }

  const avgScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const avgConfidence = totalConfidence / validAnalyses.length;

  return {
    score: avgScore,
    confidence: avgConfidence,
    direction: scoreToDirection(avgScore)
  };
}

// Calculate overall market bias
function calculateOverallBias(coinResults: {
  BTC: { score: number; confidence: number };
  SOL: { score: number; confidence: number };
  BNB: { score: number; confidence: number };
}): { bias: 'bullish' | 'bearish' | 'mixed' | 'neutral'; confidence: number } {
  const scores = [coinResults.BTC.score, coinResults.SOL.score, coinResults.BNB.score];
  const confidences = [coinResults.BTC.confidence, coinResults.SOL.confidence, coinResults.BNB.confidence];
  
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  
  // Calculate agreement (how consistent the directions are)
  const directions = scores.map(scoreToDirection);
  const uniqueDirections = new Set(directions);
  const agreement = uniqueDirections.size === 1 ? 1 : 
                   uniqueDirections.size === 2 ? 0.5 : 0.33;
  
  const finalConfidence = avgConfidence * agreement;
  
  let bias: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  
  if (avgScore >= 0.25) {
    bias = 'bullish';
  } else if (avgScore <= -0.25) {
    bias = 'bearish';
  } else if (uniqueDirections.size > 2) {
    bias = 'mixed';
  } else {
    bias = 'neutral';
  }
  
  return { bias, confidence: finalConfidence };
}

// Main aggregation function
export function computeDailyAggregate(analyses: Analysis[]): AggregateResult {
  const BTC = calculateCoinScore(analyses, 'BTC');
  const SOL = calculateCoinScore(analyses, 'SOL');
  const BNB = calculateCoinScore(analyses, 'BNB');
  
  const overall = calculateOverallBias({
    BTC: { score: BTC.score, confidence: BTC.confidence },
    SOL: { score: SOL.score, confidence: SOL.confidence },
    BNB: { score: BNB.score, confidence: BNB.confidence }
  });
  
  return {
    BTC: {
      direction: BTC.direction,
      confidence: BTC.confidence,
      score: BTC.score
    },
    SOL: {
      direction: SOL.direction,
      confidence: SOL.confidence,
      score: SOL.score
    },
    BNB: {
      direction: BNB.direction,
      confidence: BNB.confidence,
      score: BNB.score
    },
    overall
  };
}

// Filter analyses by confidence threshold
export function filterByConfidence(
  analyses: Analysis[], 
  minConfidence: number = 0.3
): Analysis[] {
  return analyses.filter(analysis => {
    if (analysis.status !== 'done' || !analysis.verdict) return false;
    
    const coins = analysis.verdict.coins;
    const avgConfidence = (
      coins.BTC.confidence + 
      coins.SOL.confidence + 
      coins.BNB.confidence
    ) / 3;
    
    return avgConfidence >= minConfidence;
  });
}

// Adjust thresholds based on sensitivity setting
export function adjustThresholds(sensitivity: 'conservative' | 'moderate' | 'aggressive') {
  switch (sensitivity) {
    case 'conservative':
      return { bullish: 0.4, bearish: -0.4, minConfidence: 0.5 };
    case 'moderate':
      return { bullish: 0.25, bearish: -0.25, minConfidence: 0.3 };
    case 'aggressive':
      return { bullish: 0.15, bearish: -0.15, minConfidence: 0.2 };
    default:
      return { bullish: 0.25, bearish: -0.25, minConfidence: 0.3 };
  }
}

// Recalculate aggregate with custom sensitivity
export function recalculateWithSensitivity(
  analyses: Analysis[],
  sensitivity: 'conservative' | 'moderate' | 'aggressive'
): AggregateResult {
  const thresholds = adjustThresholds(sensitivity);
  const filteredAnalyses = filterByConfidence(analyses, thresholds.minConfidence);
  
  return computeDailyAggregate(filteredAnalyses);
}
