"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { countries } from "@/data/countries"
import {
  initializeSort,
  recordComparison,
  getCurrentRanking,
  getCountryRank,
  getTotalComparisons,
  getRemainingComparisons,
} from "@/lib/game-logic"
import { useGroup } from "@/contexts/group-context"
import { Users, Pause, Loader2, ArrowLeft, Music, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useSwipeable } from "react-swipeable"
import Confetti from "react-confetti"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useWindowSize } from "react-use"

export default function GamePage() {
  const router = useRouter()
  const { currentGroup, currentUser, updateParticipantStatus, refreshGroup } = useGroup()
  const [currentPair, setCurrentPair] = useState<[number, number] | null>(null)
  const [upcomingPairs, setUpcomingPairs] = useState<Array<[number, number]>>([])
  const [currentRanking, setCurrentRanking] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)
  const initialCheckDone = useRef(false)
  const totalComparisons = useRef(0)
  const completedComparisons = useRef(0)
  const { theme, setTheme } = useTheme()
  const { width, height } = useWindowSize()
  const allPairsRef = useRef<Array<[number, number]>>([])

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
    /* 1️⃣  tell game‑logic how many countries we have */
    initializeSort(countries.length) // ← add this line

    /* 2️⃣  the local pair list for your UI stack */
    const allPairs = generateAllPairs(countries.length)
    allPairsRef.current = allPairs

    if (allPairs.length > 0) {
      setCurrentPair(allPairs[0])
      setUpcomingPairs(allPairs.slice(1, 5))
    }

    totalComparisons.current = getTotalComparisons()
    completedComparisons.current = 0
    setProgress(0)
    setLoading(false)
  }

  // Generate all possible pairs for the stack visualization
  const generateAllPairs = (count: number): Array<[number, number]> => {
    const pairs: Array<[number, number]> = []
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        pairs.push([i, j])
      }
    }
    // Shuffle the pairs
    return shuffleArray(pairs)
  }

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
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
  }, [currentPair])

  const handleVote = (winnerIndex: number, loserIndex: number) => {
    // Stop any playing audio
    if (audioRefA.current) audioRefA.current.pause()
    if (audioRefB.current) audioRefB.current.pause()
    setPlayingCountry(null)

    // Set animation direction
    if (winnerIndex === currentPair?.[0]) {
      setDirection("left")
    } else {
      setDirection("right")
    }

    // Record the comparison result
    completedComparisons.current += 1
    const nextPair = recordComparison(winnerIndex, loserIndex)

    // Update the current ranking
    const updatedRanking = getCurrentRanking()
    setCurrentRanking(updatedRanking)

    // Update progress
    const remaining = getRemainingComparisons()
    const completed = totalComparisons.current - remaining
    setProgress(Math.round((completed / totalComparisons.current) * 100))

    // Move to next pair or finish the game
    if (nextPair) {
      // Update the current pair and upcoming pairs
      setTimeout(() => {
        setDirection(null)
        setCurrentPair(nextPair)

        // Update the upcoming pairs
        const currentIndex = allPairsRef.current.findIndex((pair) => pair[0] === nextPair[0] && pair[1] === nextPair[1])

        if (currentIndex !== -1) {
          const newUpcoming = allPairsRef.current.slice(currentIndex + 1, currentIndex + 5)
          setUpcomingPairs(newUpcoming)
        }
      }, 300) // Short delay for animation
    } else {
      // Show confetti before navigating
      setShowConfetti(true)

      // If in a group, update status
      if (currentGroup && currentUser) {
        updateParticipantStatus("completed")
      }

      setTimeout(() => {
        // Game finished, navigate to results
        localStorage.setItem("eurovisionRankings", JSON.stringify(updatedRanking))
        router.push("/results")
      }, 1500) // Show confetti for 1.5 seconds
    }
  }

  const togglePlay = (countryIndex: number, side: "A" | "B", e: React.MouseEvent) => {
    e.stopPropagation()
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

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPair) handleVote(currentPair[1], currentPair[0]) // Swipe left = choose right country
    },
    onSwipedRight: () => {
      if (currentPair) handleVote(currentPair[0], currentPair[1]) // Swipe right = choose left country
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    delta: 50,
  })

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black dark:from-gray-900 dark:to-black text-white">
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
  if (!currentPair) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-800 to-black dark:from-gray-900 dark:to-black text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  const countryA = countries[currentPair[0]]
  const countryB = countries[currentPair[1]]
  const rankA = getCountryRank(currentPair[0])
  const rankB = getCountryRank(currentPair[1])

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black dark:from-gray-900 dark:to-black text-white">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          {currentGroup && (
            <div className="bg-pink-700/60 border border-pink-500/50 rounded-full px-4 py-1 flex items-center">
              <Users className="h-4 w-4 text-pink-300 mr-2" />
              <span className="text-sm text-white">Group: {currentGroup.name}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full bg-gray-800/50 text-white hover:bg-gray-700"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <div className="mb-4 mt-4">
          <Progress
            value={progress}
            className="h-2 bg-gray-700"
            indicatorClassName="bg-pink-500 transition-all duration-300"
          />
        </div>

        <motion.h1
          className="text-2xl md:text-3xl font-bold text-center mb-8 text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Which country do you rank higher?
        </motion.h1>

        {/* Main card comparison area */}
        <div {...swipeHandlers} className="relative mb-16">
          <div className="flex justify-center items-center gap-4 md:gap-8">
            {/* Country A Card */}
            <motion.div
              key={`active-${currentPair[0]}-${currentPair[1]}-A`}
              className="w-full md:w-[45%] flex flex-col items-center p-6 rounded-xl border border-gray-600 bg-gray-800/70 hover:bg-gray-700/70 transition-all transform hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer z-30"
              onClick={() => handleVote(currentPair[0], currentPair[1])}
              initial={{ x: 0, opacity: 1, scale: 1 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={
                direction === "left"
                  ? { x: -1000, opacity: 0, rotateZ: -10, transition: { duration: 0.3 } }
                  : { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
              }
              transition={{ duration: 0.2 }}
            >
              <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg flex justify-center items-center">
                <Image
                  src={countryA.flag || "/placeholder.svg?height=180&width=320"}
                  alt={`Flag of ${countryA.name}`}
                  width={200}
                  height={200}
                  sizes="100%"
                  className="object-cover"
                />
                <Button
                  variant="default"
                  size="icon"
                  className={`absolute bottom-2 right-2 ${playingCountry === currentPair[0] ? "bg-pink-600" : "bg-gray-800/80"} hover:bg-pink-700 text-white rounded-full z-10`}
                  onClick={(e) => togglePlay(currentPair[0], "A", e)}
                >
                  {playingCountry === currentPair[0] ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                </Button>
                <audio ref={audioRefA} src={countryA.audioFile} onEnded={() => setPlayingCountry(null)} />
              </div>
              <h2 className="text-2xl font-bold text-white">{countryA.name}</h2>
              <p className="text-gray-300">{countryA.artist}</p>
              <p className="text-pink-300 font-medium">{countryA.song}</p>

              <div className="mt-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 text-lg font-bold rounded-xl shadow-lg w-full text-center">
                Choose {countryA.name}
              </div>
            </motion.div>

            {/* Country B Card */}
            <motion.div
              key={`active-${currentPair[0]}-${currentPair[1]}-B`}
              className="w-full md:w-[45%] flex flex-col items-center p-6 rounded-xl border border-gray-600 bg-gray-800/70 hover:bg-gray-700/70 transition-all transform hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer z-30"
              onClick={() => handleVote(currentPair[1], currentPair[0])}
              initial={{ x: 0, opacity: 1, scale: 1 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={
                direction === "right"
                  ? { x: 1000, opacity: 0, rotateZ: 10, transition: { duration: 0.3 } }
                  : { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
              }
              transition={{ duration: 0.2 }}
            >
              <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg flex justify-center items-center">
                <Image
                  src={countryB.flag || "/placeholder.svg?height=180&width=320"}
                  alt={`Flag of ${countryB.name}`}
                  width={200}
                  height={200}
                  sizes="100%"
                  className="object-cover"
                />
                <Button
                  variant="default"
                  size="icon"
                  className={`absolute bottom-2 right-2 ${playingCountry === currentPair[1] ? "bg-pink-600" : "bg-gray-800/80"} hover:bg-pink-700 text-white rounded-full z-10`}
                  onClick={(e) => togglePlay(currentPair[1], "B", e)}
                >
                  {playingCountry === currentPair[1] ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                </Button>
                <audio ref={audioRefB} src={countryB.audioFile} onEnded={() => setPlayingCountry(null)} />
              </div>
              <h2 className="text-2xl font-bold text-white">{countryB.name}</h2>
              <p className="text-gray-300">{countryB.artist}</p>
              <p className="text-pink-300 font-medium">{countryB.song}</p>

              <div className="mt-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 text-lg font-bold rounded-xl shadow-lg w-full text-center">
                Choose {countryB.name}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="mt-8 text-center text-gray-300 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <p>Swipe left or right to choose your preferred country</p>
        </motion.div>
      </div>
    </div>
  )
}
