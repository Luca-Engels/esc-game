"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { countries } from "@/data/countries"
import { Share2, Home } from "lucide-react"
import { ShareDialog } from "@/components/share-dialog"
import { generateShareText } from "@/lib/share-utils"
import { useSearchParams } from "next/navigation"

export default function SharedResultsPage() {
  const [rankings, setRankings] = useState<number[]>([])
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const searchParams = useSearchParams()

  // Base URL for sharing
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  // Generate share text based on rankings
  const shareText = rankings.length > 0 ? generateShareText(rankings, countries) : ""

  useEffect(() => {
    // Get rankings from URL parameter
    const rankingsParam = searchParams.get("r")

    if (rankingsParam) {
      try {
        const decodedRankings = JSON.parse(decodeURIComponent(rankingsParam))
        console.log("SharedResultsPage: Decoded rankings from URL:", decodedRankings)

        // Validate that the rankings are valid indices
        const validRankings = decodedRankings.filter(
          (idx: number) => typeof idx === "number" && idx >= 0 && idx < countries.length,
        )

        if (validRankings.length > 0) {
          setRankings(validRankings)
        }
      } catch (error) {
        console.error("SharedResultsPage: Error parsing rankings from URL:", error)
      }
    }
  }, [searchParams])

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  if (rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="text-2xl mb-6">No ranking data found</div>
        <Link href="/">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">Create Your Own Ranking</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center my-8 text-white">Shared Eurovision 2024 Ranking</h1>

        <div className="space-y-4 mb-8">
          {rankings.map((countryIndex, rank) => {
            const country = countries[countryIndex]
            return (
              <div
                key={countryIndex}
                className="flex items-center p-4 rounded-lg bg-gray-800/70 border border-gray-700"
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
          <Link href="/">
            <Button className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 text-white">
              <Home className="mr-2 h-4 w-4" /> Create Your Own
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full md:w-auto border-pink-500 text-pink-300 hover:bg-pink-900/50"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share This Ranking
          </Button>
        </div>
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} shareText={shareText} shareUrl={shareUrl} />
    </div>
  )
}
