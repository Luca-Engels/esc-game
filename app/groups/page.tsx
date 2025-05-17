"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Participant, useGroup } from "@/contexts/group-context"
import { useToast } from "@/hooks/use-toast"
import { Users, UserPlus, ArrowLeft, Loader2 } from "lucide-react"
import { createGroup, getAllGroups } from "./actions"

export default function GroupsPage() {
  const router = useRouter()
  const { joinGroup, currentGroup, setCurrentUser, setCurrentGroup } = useGroup()
  const { toast } = useToast()

  const [newGroupName, setNewGroupName] = useState("")
  const [joinGroupId, setJoinGroupId] = useState("")
  const [userName, setUserName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [groups, setGroups] = useState([])
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  // Check if groups are loaded and ensure user isn't in a group already
  useEffect(() => {
    const fetchGroups = async () => {
      const groups = await getAllGroups()
      setGroups(groups)
      console.log("GroupsPage: Fetched groups:", groups)
    }
    fetchGroups()

    // If the user is already in a group, redirect to the invite page
    if (currentGroup) {
      router.push("/groups/invite")
    }

    setGroupsLoaded(true)
  }, [getAllGroups, currentGroup, router])

  // Make sure to leave any existing group when visiting this page

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both group name and your name",
        variant: "destructive",
      })
      return
    }

    console.log("GroupsPage: Creating and joining group", { newGroupName, userName })
    setIsCreating(true)

    try {
      // Use the atomic operation to create and join in one step
      const userId = crypto.randomUUID()
      const group = await createGroup(newGroupName, userId)
      const user: Participant = { id: userId, name: userName, rankings: [], status: "waiting", timestamp: Date.now() }
      setCurrentGroup(group)
      setCurrentUser(user)

      // const groupId = createAndJoinGroup(newGroupName, userName)

      if (group) {
        console.log("GroupsPage: Successfully created and joined group:", group)
        toast({
          title: "Group created",
          description: `Group "${newGroupName}" created successfully!`,
        })

        // Add a small delay before navigating to ensure the group is properly created
        setTimeout(() => {
          // Navigate to invite page
          console.log("GroupsPage: Navigating to invite page")
          router.push("/groups/invite")
        }, 500)
      } else {
        console.error("GroupsPage: Failed to create and join group")
        toast({
          title: "Error",
          description: "Failed to create group. Please try again.",
          variant: "destructive",
        })
        setIsCreating(false)
      }
    } catch (error) {
      console.error("GroupsPage: Error in group creation process:", error)
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      })
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinGroupId.trim() || !userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both group code and your name",
        variant: "destructive",
      })
      return
    }

    console.log("GroupsPage: Joining group", { joinGroupId, userName })
    setIsJoining(true)

    try {
      // Find the full group ID that starts with the provided code
      const groups = await getAllGroups()
      console.log("GroupsPage: Available groups for joining:", groups)

      const matchingGroup = groups.find((g) => g.id.startsWith(joinGroupId))

      if (!matchingGroup) {
        console.log("GroupsPage: No matching group found for code:", joinGroupId)
        toast({
          title: "Error",
          description: "Group not found. Please check the code and try again.",
          variant: "destructive",
        })
        setIsJoining(false)
        return
      }

      console.log("GroupsPage: Found matching group:", matchingGroup)

      const joined = joinGroup(matchingGroup.id, userName)

      if (joined) {
        console.log("GroupsPage: Successfully joined group, navigating to invite page")
        toast({
          title: "Joined group",
          description: `You've joined "${matchingGroup.name}" successfully`,
        })

        // Navigate to invite page
        router.push("/groups/invite")
      } else {
        console.error("GroupsPage: Failed to join group")
        toast({
          title: "Error",
          description: "Failed to join group. Please try again.",
          variant: "destructive",
        })
        setIsJoining(false)
      }
    } catch (error) {
      console.error("GroupsPage: Error joining group:", error)
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      })
      setIsJoining(false)
    }
  }

  if (!groupsLoaded) {
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

        <h1 className="text-3xl font-bold text-center mb-8 text-white">Eurovision Group Ranking</h1>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="create" className="data-[state=active]:bg-pink-600 text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Group
            </TabsTrigger>
            <TabsTrigger value="join" className="data-[state=active]:bg-pink-600 text-white">
              <Users className="mr-2 h-4 w-4" />
              Join Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="bg-gray-900 border-gray-700 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Create a new group</CardTitle>
                <CardDescription className="text-gray-300">
                  Create a group and invite friends to compare rankings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Group Name</label>
                  <Input
                    placeholder="Eurovision Party 2024"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Your Name</label>
                  <Input
                    placeholder="Your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                  onClick={handleCreateGroup}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card className="bg-gray-900 border-gray-700 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Join an existing group</CardTitle>
                <CardDescription className="text-gray-300">Enter the group code shared with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Group Code</label>
                  <Input
                    placeholder="Enter group code"
                    value={joinGroupId}
                    onChange={(e) => setJoinGroupId(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Your Name</label>
                  <Input
                    placeholder="Your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
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
          </TabsContent>
        </Tabs>
        {groups.length}
      </div>
    </div>
  )
}
