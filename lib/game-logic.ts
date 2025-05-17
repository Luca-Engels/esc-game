// Track transitive dominance using adjacency matrix
let dominance: boolean[][] = []
let countryCount = 0
let remainingPairs: Array<[number, number]> = []

export function initializeSort(count: number): [number, number] {
countryCount = count
dominance = Array(count).fill(null).map(() => Array(count).fill(false))

// Initial all possible unique pairs
remainingPairs = []
for (let i = 0; i < count; i++) {
for (let j = i + 1; j < count; j++) {
remainingPairs.push([i, j])
}
}

remainingPairs = shuffleArray(remainingPairs)

return getNextPair()
}

export function recordComparison(winner: number, loser: number): [number, number] | null {
if (dominance[winner][loser]) return getNextPair()

// Set direct dominance
dominance[winner][loser] = true

// Floyd-Warshall style transitive closure
for (let i = 0; i < countryCount; i++) {
for (let j = 0; j < countryCount; j++) {
if (dominance[i][winner] && dominance[loser][j]) {
dominance[i][j] = true
}
}
}

// Update transitivity directly for current winner
for (let i = 0; i < countryCount; i++) {
if (dominance[i][winner]) {
dominance[i][loser] = true
}
if (dominance[loser][i]) {
dominance[winner][i] = true
}
}

return getNextPair()
}

function getNextPair(): [number, number] | null {
while (remainingPairs.length > 0) {
const [a, b] = remainingPairs.shift()!
if (!dominance[a][b] && !dominance[b][a]) {
return [a, b]
}
}
return null
}

export function getCurrentRanking(): number[] {
const scores: [number, number][] = []
for (let i = 0; i < countryCount; i++) {
const wins = dominance[i].filter((v) => v).length
scores.push([i, wins])
}
scores.sort((a, b) => b[1] - a[1])
return scores.map(([index]) => index)
}

export function getCountryRank(index: number): number | null {
const ranking = getCurrentRanking()
const pos = ranking.indexOf(index)
return pos >= 0 ? pos + 1 : null
}

export function getTotalComparisons(): number {
return (countryCount * (countryCount - 1)) / 2
}

export function getRemainingComparisons(): number {
return remainingPairs.filter(([a, b]) => !dominance[a][b] && !dominance[b][a]).length
}

function shuffleArray<T>(array: T[]): T[] {
const newArray = [...array]
for (let i = newArray.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1))
;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
}
return newArray
}
