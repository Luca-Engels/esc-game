"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGroup } from "@/contexts/group-context"
import { countries } from "@/data/countries"
import { Users, ArrowLeft, Medal, RefreshCw, Loader2 } from "lucide-react"

export default function GroupResultsPage() {
  const { currentGroup, currentUser, refreshGroup } = useGroup()
  const [aggregatedRanking, setAggregatedRanking] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Give a short delay to ensure the group context is loaded
    const timer = setTimeout(() => {
      setLoading(false)
      calculateAggregatedRanking()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    calculateAggregatedRanking()
  }, [currentGroup])

  const calculateAggregatedRanking = () => {
    if (currentGroup && currentGroup.participants.length > 0) {
      // Get only participants who have completed their rankings
      const completedParticipants = currentGroup.participants.filter(
        (p) => p.status === "completed" && p.rankings.length > 0,
      )

      if (completedParticipants.length === 0) {
        setAggregatedRanking([])
        return
      }

      // Calculate the aggregated ranking based on completed participants
      const scores: Record<number, number> = {}

      // Initialize scores
      countries.forEach((_, index) => {
        scores[index] = 0
      })

      // For each participant, add points based on their ranking
      // Higher ranks (lower position numbers) get more points
      completedParticipants.forEach((participant) => {
        participant.rankings.forEach((countryIndex, position) => {
          // Reverse the scoring so that first place gets the most points
          const points = countries.length - position
          scores[countryIndex] += points
        })
      })

      // Convert scores to array of [countryIndex, score] pairs and sort
      const scoreEntries = Object.entries(scores).map(([countryIndex, score]) => [Number.parseInt(countryIndex), score])

      // Sort by score (descending)
      scoreEntries.sort((a, b) => b[1] - a[1])

      // Extract just the country indices in ranked order
      setAggregatedRanking(scoreEntries.map((entry) => entry[0]))
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    refreshGroup()
    calculateAggregatedRanking()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xl">Loading group results...</span>
        </div>
      </div>
    )
  }

  if (!currentGroup || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="text-2xl mb-6">No group joined</div>
        <Link href="/groups">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white font-medium">Create or Join a Group</Button>
        </Link>
      </div>
    )
  }

  // Get completed participants
  const completedParticipants = currentGroup.participants.filter(
    (p) => p.status === "completed" && p.rankings.length > 0,
  )

  // Sort participants by name
  const sortedParticipants = [...completedParticipants].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="w-full max-w-6xl">
        <div className="mb-8 flex justify-between items-center">
          <Link href="/results" className="flex items-center text-white hover:text-pink-300 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to your results
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            <div className="flex items-center text-gray-300">
              <Users className="mr-2 h-4 w-4 text-pink-300" />
              <span>
                {completedParticipants.length} of {currentGroup.participants.length} completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="bg-pink-700 px-4 py-2 rounded-full text-lg font-medium text-white border border-pink-600 shadow-lg">
            Group: {currentGroup.name}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          <span className="text-pink-400">Group</span> Eurovision Ranking
        </h1>

        {completedParticipants.length === 0 ? (
          <div className="text-center p-8 bg-gray-900 rounded-lg border border-gray-700 shadow-lg">
            <p className="text-xl mb-4 font-medium">No completed rankings yet</p>
            <p className="text-gray-300">Group members need to complete their rankings before results can be shown.</p>
          </div>
        ) : (
          <>
            {aggregatedRanking.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4 flex items-center text-white">
                  <Medal className="mr-2 h-5 w-5 text-yellow-400" />
                  Combined Group Ranking
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {aggregatedRanking.map((countryIndex, rank) => {
                    const country = countries[countryIndex]
                    return (
                      <div
                        key={countryIndex}
                        className="flex flex-col items-center p-4 rounded-lg bg-gray-900 border border-gray-700 shadow-md"
                      >
                        <div className="text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-pink-600 text-white mb-2 shadow-md">
                          {rank + 1}
                        </div>
                        <div className="relative w-full aspect-video mb-2 overflow-hidden rounded-lg">
                          <Image
                            src={country.flag || "/placeholder.svg?height=120&width=200"}
                            alt={`Flag of ${country.name}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h3 className="font-bold text-center text-white">{country.name}</h3>
                        <p className="text-sm text-gray-300 text-center">{country.song}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <h2 className="text-xl font-bold mb-4 text-white">Individual Rankings</h2>
              <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-lg p-4">
                <Table className="w-full border-collapse">
                  <TableHeader>
                    <TableRow className="bg-gray-800 border-gray-700">
                      <TableHead className="text-left text-gray-300 w-40 font-medium">Participant</TableHead>
                      {[...Array(countries.length)].map((_, i) => (
                        <TableHead key={i} className="text-center text-gray-300 font-medium">
                          {i + 1}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedParticipants.map((participant) => (
                      <TableRow
                        key={participant.id}
                        className={`border-b border-gray-700 ${
                          participant.id === currentUser.id ? "bg-pink-900/30" : "bg-gray-800/50"
                        }`}
                      >
                        <TableCell className="font-medium text-white">
                          {participant.name}
                          {participant.id === currentUser.id && (
                            <span className="ml-2 text-xs text-pink-300">(You)</span>
                          )}
                          {participant.id === currentGroup.hostId && (
                            <span className="ml-2 text-xs text-yellow-300">(Host)</span>
                          )}
                        </TableCell>
                        {participant.rankings.map((countryIndex, i) => {
                          const country = countries[countryIndex]
                          return (
                            <TableCell key={i} className="text-center p-1">
                              <div className="flex flex-col items-center">
                                <div className="relative w-8 h-5 mb-1 overflow-hidden rounded">
                                  <Image
                                    src={country.flag || "/placeholder.svg?height=20&width=32"}
                                    alt={`Flag of ${country.name}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="text-xs text-gray-300">{country.name}</span>
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-center mt-8">
          <Link href="/groups/invite">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white font-medium">Back to Group</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
