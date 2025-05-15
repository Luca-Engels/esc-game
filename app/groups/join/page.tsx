"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroup } from "@/contexts/group-context"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getAllGroups } from "../actions"

export default function JoinGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { joinGroup } = useGroup()
  const { toast } = useToast()

  const [groupCode, setGroupCode] = useState("")
  const [userName, setUserName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableGroups, setAvailableGroups] = useState<any[]>([])

  useEffect(() => {
    // Get the group code from the URL
    const code = searchParams.get("code")
    if (code) {
      setGroupCode(code)
    }

    // Get all available groups
    const fetchGroups = async () => {
      const groups = await getAllGroups()
      console.log("JoinGroupPage: Available groups:", groups)
      setAvailableGroups(groups)
    }
    fetchGroups()

    setLoading(false)
  }, [searchParams, getAllGroups])

  const handleJoinGroup = async () => {
    if (!groupCode.trim() || !userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both group code and your name",
        variant: "destructive",
      })
      return
    }

    console.log("JoinGroupPage: Joining group", { groupCode, userName })
    setIsJoining(true)

    try {
      // Find the full group ID that starts with the provided code
      console.log("JoinGroupPage: Available groups for joining:", availableGroups)

      const matchingGroup = availableGroups.find((g) => g.id.startsWith(groupCode))

      if (!matchingGroup) {
        console.log("JoinGroupPage: No matching group found for code:", groupCode)
        toast({
          title: "Error",
          description: "Group not found. Please check the code and try again.",
          variant: "destructive",
        })
        setIsJoining(false)
        return
      }

      console.log("JoinGroupPage: Found matching group:", matchingGroup)

      const joined = joinGroup(matchingGroup.id, userName)

      if (joined) {
        console.log("JoinGroupPage: Successfully joined group, navigating to invite page")
        toast({
          title: "Joined group",
          description: `You've joined "${matchingGroup.name}" successfully`,
        })

        // Navigate to invite page
        router.push("/groups/invite")
      } else {
        console.error("JoinGroupPage: Failed to join group")
        toast({
          title: "Error",
          description: "Failed to join group. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("JoinGroupPage: Error joining group:", error)
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-purple-800 to-black text-white">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="flex items-center text-white hover:text-pink-300 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <Card className="bg-gray-900 border-gray-700 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Join Eurovision Group</CardTitle>
            <CardDescription className="text-gray-300">Enter your name to join the group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Group Code</label>
              <Input
                placeholder="Enter group code"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                readOnly={!!searchParams.get("code")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Your Name</label>
              <Input
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
              onClick={handleJoinGroup}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Group"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
