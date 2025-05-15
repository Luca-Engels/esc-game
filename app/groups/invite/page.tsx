"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroup } from "@/contexts/group-context"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check, ArrowRight, Loader2, RefreshCw, Play } from "lucide-react"
import QRCodeCanvas from "@/components/qr-code"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function GroupInvitePage() {
  const router = useRouter()
  const { currentGroup, currentUser, isHost, startGroupGame, refreshGroup, leaveGroup } = useGroup()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [groupCode, setGroupCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [qrValue, setQrValue] = useState("")

  useEffect(() => {
    // Give a short delay to ensure the group context is loaded
    const timer = setTimeout(() => {
      setLoading(false)

      if (currentGroup) {
        // Use just the first 8 characters of the UUID for easier sharing
        const code = currentGroup.id.substring(0, 8)
        setGroupCode(code)

        // Set QR code value
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://eurovision-ranking.vercel.app"
        setQrValue(`${baseUrl}/groups/join?code=${code}`)
      } else {
        // If no group is found, redirect to groups page
        router.push("/groups")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [currentGroup?.id, router])

  // Set up periodic refresh to check if the group still exists
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (currentGroup) {
      intervalId = setInterval(() => {
        refreshGroup()
      }, 1000) // Check every 1 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [currentGroup?.id]) // Only depend on the group ID, not the entire group object

  const handleRefresh = () => {
    setRefreshing(true)
    refreshGroup()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleStartGame = () => {
    if (startGroupGame()) {
      toast({
        title: "Game started",
        description: "All participants can now start ranking!",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = () => {
    leaveGroup()
    router.push("/groups")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xl">Loading group information...</span>
        </div>
      </div>
    )
  }
  console.log(!currentGroup)
  console.log(!currentUser)

  if (!currentGroup || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="text-2xl mb-6">No group joined</div>
        <Link href="/groups">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">Create or Join a Group</Button>
        </Link>
      </div>
    )
  }
  const copyGroupCode = async () => {
    try {
      await navigator.clipboard.writeText(groupCode)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Group code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-700 text-white shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-center text-white">Group: {currentGroup.name}</CardTitle>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleRefresh}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <CardDescription className="text-center text-gray-300">
              {isHost() ? "Invite friends to join your group" : "Waiting for the host to start the game"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="code" className="data-[state=active]:bg-pink-600 text-white">
                  Code
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-pink-600 text-white">
                  QR Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="mt-4">
                <div className="bg-gray-800 p-4 rounded-md flex items-center justify-between border border-gray-700">
                  <div className="text-2xl font-mono tracking-wider text-pink-400">{groupCode}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-600 hover:bg-gray-700 text-white"
                    onClick={copyGroupCode}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="qr" className="mt-4 flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeCanvas
                    value={qrValue}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">Participants ({currentGroup.participants.length})</h3>
                <span className="text-xs text-gray-400">Status</span>
              </div>

              <div className="bg-gray-800 rounded-md border border-gray-700 divide-y divide-gray-700 max-h-40 overflow-y-auto">
                {currentGroup.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                      <span className="text-sm font-medium">
                        {participant.name}
                        {participant.id === currentUser.id && " (You)"}
                        {participant.id === currentGroup.hostId && (
                          <span className="ml-1 text-xs text-pink-400">(Host)</span>
                        )}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        participant.status === "waiting"
                          ? "bg-gray-700 text-gray-300"
                          : participant.status === "ready"
                            ? "bg-yellow-700 text-yellow-200"
                            : "bg-green-700 text-green-200"
                      }`}
                    >
                      {participant.status === "waiting" && "Waiting"}
                      {participant.status === "ready" && "Ready"}
                      {participant.status === "completed" && "Completed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {isHost() ? (
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                onClick={handleStartGame}
                disabled={currentGroup.gameStarted}
              >
                {currentGroup.gameStarted ? "Game Started" : "Start Game for Everyone"}
                <Play className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="text-center text-gray-300 w-full">
                {currentGroup.gameStarted ? (
                  <Link href="/game" className="w-full">
                    <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium">
                      Start Ranking
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-5 w-5 animate-spin mb-2" />
                    <span>Waiting for host to start the game...</span>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={handleLeaveGroup}
            >
              Leave Group
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
