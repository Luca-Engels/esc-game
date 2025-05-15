/**
 * Generates all possible pairs of indices for comparison
 * @param count The number of items to generate pairs for
 * @returns Array of pairs as tuples [indexA, indexB]
 */
export function generatePairs(count: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = []

  // Generate all possible pairs
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      pairs.push([i, j])
    }
  }

  // Shuffle the pairs
  return shuffleArray(pairs)
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Calculates the final rankings based on vote counts
 * @param votes Record of country index to vote count
 * @returns Array of country indices sorted by rank (highest votes first)
 */
export function calculateRankings(votes: Record<number, number>): number[] {
  // Convert votes object to array of [countryIndex, voteCount] pairs
  const voteEntries = Object.entries(votes).map(([countryIndex, voteCount]) => [
    Number.parseInt(countryIndex),
    voteCount,
  ])

  // Sort by vote count (descending)
  voteEntries.sort((a, b) => b[1] - a[1])

  // Return just the country indices in ranked order
  return voteEntries.map((entry) => entry[0])
}
