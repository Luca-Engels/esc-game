"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { countries } from "@/data/countries"
import { generatePairs, calculateRankings } from "@/lib/game-logic"
import { useGroup } from "@/contexts/group-context"
import { Users, Play, Pause, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GamePage() {
  const router = useRouter()
  const { currentGroup, currentUser,updateParticipantStatus, refreshGroup } = useGroup()
  const [pairs, setPairs] = useState<Array<[number, number]>>([])
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [votes, setVotes] = useState<Record<number, number>>({})
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const initialCheckDone = useRef(false)

  // Audio state
  const [playingCountry, setPlayingCountry] = useState<number | null>(null)
  const audioRefA = useRef<HTMLAudioElement>(null)
  const audioRefB = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // This effect runs once on mount to check if we're in solo mode or group mode
    const checkGameMode = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const mode = searchParams.get("mode")
        const isSoloMode = mode === "solo"

        if (isSoloMode) {
          // Solo mode - proceed with game setup
          console.log("GamePage: Solo mode detected")
          initializeGame()
          return
        }

        // Group mode - check if the game has been started by the host
        if (!currentGroup) {
          console.log("GamePage: No group found, redirecting to groups page")
          router.push("/groups")
          return
        }

        if (!currentGroup.gameStarted) {
          console.log("GamePage: Game not started yet, redirecting to invite page")
          router.push("/groups/invite")
          return
        }

        console.log("GamePage: Group game started, initializing game")
        setGameStarted(true)
        initializeGame()
      } catch (error) {
        console.error("GamePage: Error checking game mode:", error)
        setLoading(false)
      }
    }

    if (!initialCheckDone.current) {
      checkGameMode()
      initialCheckDone.current = true
    }
  }, [currentGroup, router])

  // Set up a separate effect for refreshing the group data periodically
  useEffect(() => {
    // Only set up the refresh interval if we're in group mode and the game has started
    if (currentGroup && gameStarted) {
      const intervalId = setInterval(() => {
        refreshGroup()
      }, 10000) // Check every 10 seconds

      return () => clearInterval(intervalId)
    }
  }, [currentGroup, gameStarted, refreshGroup])
  useEffect(() => {
    // Check if the user is a participant and update their status
    if (currentUser) {
      const participant = currentGroup?.participants.find((p) => p.id === currentUser.id)
      if (participant && participant.status !== "ranking") {
        updateParticipantStatus("ranking")
      }
    }
  }, [currentUser, currentGroup, updateParticipantStatus])


  const initializeGame = () => {
    // Generate all possible pairs of countries
    const generatedPairs = generatePairs(countries.length)
    setPairs(generatedPairs)

    // Initialize votes counter for each country
    const initialVotes: Record<number, number> = {}
    countries.forEach((_, index) => {
      initialVotes[index] = 0
    })
    setVotes(initialVotes)
    setLoading(false)
  }

  // Stop audio when changing pairs
  useEffect(() => {
    if (audioRefA.current) {
      audioRefA.current.pause()
      audioRefA.current.currentTime = 0
    }
    if (audioRefB.current) {
      audioRefB.current.pause()
      audioRefB.current.currentTime = 0
    }
    setPlayingCountry(null)
  }, [currentPairIndex])

  const handleVote = (winnerIndex: number) => {
    // Stop any playing audio
    if (audioRefA.current) audioRefA.current.pause()
    if (audioRefB.current) audioRefB.current.pause()
    setPlayingCountry(null)

    // Increment vote count for the selected country
    setVotes((prev) => ({
      ...prev,
      [winnerIndex]: prev[winnerIndex] + 1,
    }))

    // Move to next pair or finish the game
    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex((prev) => prev + 1)
      setProgress(Math.round(((currentPairIndex + 1) / pairs.length) * 100))
    } else {
      // Game finished, navigate to results
      const rankings = calculateRankings(votes)
      localStorage.setItem("eurovisionRankings", JSON.stringify(rankings))
      router.push("/results")
    }
  }

  const togglePlay = (countryIndex: number, side: "A" | "B") => {
    const audioRef = side === "A" ? audioRefA.current : audioRefB.current

    // If this country is already playing, pause it
    if (playingCountry === countryIndex) {
      if (audioRef) {
        audioRef.pause()
      }
      setPlayingCountry(null)
    } else {
      // Pause any currently playing audio
      if (audioRefA.current) audioRefA.current.pause()
      if (audioRefB.current) audioRefB.current.pause()

      // Play the selected country's audio
      if (audioRef) {
        audioRef.play().catch((err) => {
          console.error("Error playing audio:", err)
        })
      }
      setPlayingCountry(countryIndex)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-pink-400" />
          <div className="text-2xl">Loading game...</div>
          {currentGroup && (
            <Link href="/groups/invite">
              <Button variant="outline" className="mt-4 border-pink-500 text-pink-300">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Group
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Wait until pairs are generated
  if (pairs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  const currentPair = pairs[currentPairIndex]
  const countryA = countries[currentPair[0]]
  const countryB = countries[currentPair[1]]

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="w-full max-w-4xl">
        {currentGroup && (
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-pink-700/60 border border-pink-500/50 rounded-full px-4 py-1 flex items-center">
              <Users className="h-4 w-4 text-pink-300 mr-2" />
              <span className="text-sm text-white">Group: {currentGroup.name}</span>
            </div>
          </div>
        )}

        <div className="mb-4 mt-4">
          <Progress value={progress} className="h-2 bg-gray-700" indicatorClassName="bg-pink-500" />
          <div className="text-right text-sm mt-1 text-gray-300">
            {currentPairIndex + 1} of {pairs.length} comparisons
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white">
          Which country do you rank higher?
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country A */}
          <div className="flex flex-col items-center p-6 rounded-xl border border-gray-600 bg-gray-800/70 hover:bg-gray-700/70 transition">
            <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg">
              <Image
                src={countryA.flag || "/placeholder.svg?height=180&width=320"}
                alt={`Flag of ${countryA.name}`}
                fill
                className="object-cover"
              />
              <Button
                variant="default"
                size="icon"
                className="absolute bottom-2 right-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full"
                onClick={() => togglePlay(currentPair[0], "A")}
              >
                {playingCountry === currentPair[0] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <audio ref={audioRefA} src={countryA.audioFile} onEnded={() => setPlayingCountry(null)} />
            </div>
            <h2 className="text-2xl font-bold text-white">{countryA.name}</h2>
            <p className="text-gray-300">{countryA.artist}</p>
            <p className="text-pink-300 font-medium">{countryA.song}</p>

            <Button
              className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => handleVote(currentPair[0])}
            >
              Choose {countryA.name}
            </Button>
          </div>

          {/* Country B */}
          <div className="flex flex-col items-center p-6 rounded-xl border border-gray-600 bg-gray-800/70 hover:bg-gray-700/70 transition">
            <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg">
              <Image
                src={countryB.flag || "/placeholder.svg?height=180&width=320"}
                alt={`Flag of ${countryB.name}`}
                fill
                className="object-cover"
              />
              <Button
                variant="default"
                size="icon"
                className="absolute bottom-2 right-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full"
                onClick={() => togglePlay(currentPair[1], "B")}
              >
                {playingCountry === currentPair[1] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <audio ref={audioRefB} src={countryB.audioFile} onEnded={() => setPlayingCountry(null)} />
            </div>
            <h2 className="text-2xl font-bold text-white">{countryB.name}</h2>
            <p className="text-gray-300">{countryB.artist}</p>
            <p className="text-pink-300 font-medium">{countryB.song}</p>

            <Button
              className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => handleVote(currentPair[1])}
            >
              Choose {countryB.name}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
