"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { useGroup } from "@/contexts/group-context"
import { useRouter } from "next/navigation"

export default function Home() {
  const { leaveGroup } = useGroup()
  const router = useRouter()

  const handleStartSolo = () => {
    // Leave any existing group when starting solo
    leaveGroup()
    router.push("/game?mode=solo")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Eurovision <span className="text-pink-400">Ranking Game</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-200">
          Create your personal Eurovision ranking by comparing countries one pair at a time
        </p>

        <div className="py-8 flex flex-col md:flex-row gap-4 items-center justify-center">
          <Button
            size="lg"
            className="bg-pink-600 hover:bg-pink-700 text-white text-lg px-8 py-6"
            onClick={handleStartSolo}
          >
            Start Solo Ranking
          </Button>

          <Link href="/groups">
            <Button
              size="lg"
              variant="outline"
              className="border-pink-500 text-pink-300 hover:bg-pink-900/50 text-lg px-8 py-6"
            >
              <Users className="mr-2 h-5 w-5" />
              Group Mode
            </Button>
          </Link>
        </div>

        <div className="text-sm text-gray-300 mt-8">
          Compare 4 countries in a series of head-to-head matchups to generate your personal ranking
        </div>
      </div>
    </div>
  )
}
