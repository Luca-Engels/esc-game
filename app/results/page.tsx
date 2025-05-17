"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { countries } from "@/data/countries"
import { Share2, Users, ArrowRight, Trophy } from "lucide-react"
import { ShareDialog } from "@/components/share-dialog"
import { generateShareText, generateShareableUrl } from "@/lib/share-utils"
import { useToast } from "@/hooks/use-toast"
import { useGroup } from "@/contexts/group-context"

export default function ResultsPage() {
  const [rankings, setRankings] = useState<number[]>([])
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const { toast } = useToast()
  const { currentGroup, currentUser, addRankingToGroup,updateParticipantStatus } = useGroup()

  // Generate shareable URL for direct link sharing
  const shareUrl =
    rankings.length > 0 ? generateShareableUrl(rankings) : typeof window !== "undefined" ? window.location.origin : ""

  // Generate share text based on rankings
  const shareText = rankings.length > 0 ? generateShareText(rankings, countries) : ""

  useEffect(() => {
    console.log("ResultsPage: Loading rankings from localStorage")
    const storedRankings = localStorage.getItem("eurovisionRankings")
    console.log("ResultsPage: Stored rankings:", storedRankings)
    console.log(currentUser, currentGroup)

    if (storedRankings) {
      try {
        const parsedRankings = JSON.parse(storedRankings)
        console.log("ResultsPage: Loaded rankings:", parsedRankings)
        setRankings(parsedRankings)

        // If user is in a group, add their ranking to the group
        if (currentGroup && currentUser) {
          updateParticipantStatus("completed")
          console.log("ResultsPage: Adding ranking to group", {
            groupId: currentGroup.id,
            userId: currentUser.id,
          })
          addRankingToGroup(parsedRankings)
        }
      } catch (error) {
        console.error("ResultsPage: Error parsing rankings:", error)
      }
    } else {
      console.log("ResultsPage: No rankings found in localStorage")
    }
  },[])

  const handleShare = () => {
    console.log("ResultsPage: Opening share dialog")
    setShareDialogOpen(true)
  }

  if (rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="text-2xl mb-6">No rankings found</div>
        <Link href="/game">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white font-medium">Start a New Ranking</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center my-8 text-white">Your Eurovision 2024 Ranking</h1>

        {currentGroup && (
          <div className="mb-8 flex justify-center">
            <div className="bg-pink-700 border border-pink-600 rounded-lg p-4 flex items-center shadow-lg">
              <Users className="h-5 w-5 text-pink-300 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-white">
                  You're in group: <span className="font-bold">{currentGroup.name}</span>
                </p>
                <p className="text-xs text-gray-300">Your ranking has been added to the group results</p>
              </div>
              <Link href="/groups/results">
                <Button variant="outline" size="sm" className="border-pink-500 text-pink-300 hover:bg-pink-900">
                  View Group Results
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {rankings.map((countryIndex, rank) => {
            const country = countries[countryIndex]
            return (
              <div
                key={countryIndex}
                className="flex items-center p-4 rounded-lg bg-gray-900 border border-gray-700 shadow-md"
              >
                <div className="text-2xl font-bold w-10 text-center text-pink-400">{rank + 1}</div>
                <div className="relative w-16 h-10 mx-4 overflow-hidden rounded">
                  <Image
                    src={country.flag || "/placeholder.svg?height=40&width=64"}
                    alt={`Flag of ${country.name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg text-white">{country.name}</h2>
                  <p className="text-sm text-gray-300">
                    {country.song} - {country.artist}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
          <Link href="/game">
            <Button className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 text-white font-medium">
              <Trophy className="mr-2 h-4 w-4" /> Start Over
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full md:w-auto border-pink-500 text-pink-300 hover:bg-pink-900"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share Your Ranking
          </Button>

          {!currentGroup && (
            <Link href="/groups">
              <Button variant="outline" className="w-full md:w-auto border-pink-500 text-pink-300 hover:bg-pink-900">
                <Users className="mr-2 h-4 w-4" /> Group Mode
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} shareText={shareText} shareUrl={shareUrl} />
    </div>
  )
}
