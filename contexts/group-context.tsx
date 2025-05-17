"use client"

import { getAllGroups, updateGroup } from "@/app/groups/actions"
import { createContext, useContext, useState, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"

// Types for our group functionality
export type Participant = {
  id: string
  name: string
  rankings: number[]
  timestamp: number
  status: "waiting" | "ranking" | "completed"
}

export type Group = {
  id: string
  name: string
  participants: Participant[]
  createdAt: number
  hostId: string
  gameStarted: boolean
  lastUpdated: number
}

type GroupContextType = {
  currentGroup: Group | null
  currentUser: { id: string; name: string } | null
  setCurrentGroup: (group: Group | null) => void
  setCurrentUser: (user: Participant | null) => void
  createGroup: (name: string) => string
  joinGroup: (groupId: string, userName: string) => boolean
  leaveGroup: () => void
  removeUserFromGroup: (userId: string, groupId: string) => void
  addRankingToGroup: (rankings: number[]) => void
  getGroupById: (groupId: string) => Group | null
  createAndJoinGroup: (groupName: string, userName: string) => string | null
  startGroupGame: () => boolean
  updateParticipantStatus: (status: "waiting" | "ranking" | "completed") => boolean
  isHost: () => boolean
  refreshGroup: () => void
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

// Helper function to safely parse JSON from localStorage
const safelyParseJSON = (json: string | null, fallback: any = null) => {
  if (!json) return fallback
  try {
    return JSON.parse(json)
  } catch (e) {
    console.error("Error parsing JSON:", e)
    return fallback
  }
}

// Create a shared storage key for groups that will be consistent across all instances

export function GroupProvider({ children }: { children: ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const joinGroup = async (groupId: string, userName: string) => {
    if (!groupId || !userName) return false

    console.log("GroupContext: Joining group", { groupId, userName })

    try {
      const groups = await getAllGroups()
      console.log("GroupContext: Available groups:", groups)

      const group = groups.find((g) => g.id === groupId)
      if (!group) {
        console.error("GroupContext: Group not found", groupId)
        return false
      }

      const userId = uuidv4()
      const newParticipant: Participant = {
        id: userId,
        name: userName,
        rankings: [],
        timestamp: Date.now(),
        status: "waiting",
      }

      // Create a deep copy to avoid reference issues
      const updatedGroup = JSON.parse(JSON.stringify(group))
      updatedGroup.participants.push(newParticipant)
      updatedGroup.lastUpdated = Date.now()

      // Update the group in the API first
      await updateGroup(updatedGroup)

      // Then update local state
      setCurrentGroup(updatedGroup)
      setCurrentUser({ id: userId, name: userName })

      // Save to localStorage
      localStorage.setItem("currentGroup", JSON.stringify(updatedGroup))
      localStorage.setItem("currentUser", JSON.stringify(newParticipant))

      console.log("GroupContext: Successfully joined group", updatedGroup)
      return true
    } catch (error) {
      console.error("GroupContext: Error joining group", error)
      return false
    }
  }
  const leaveGroup = () => {
    if (!currentGroup || !currentUser) return
    const group = { ...currentGroup }
    group.participants = group.participants.filter((p) => p.id !== currentUser.id)
    setCurrentGroup(group)
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
    updateGroup(group)
  }
  const removeUserFromGroup = async (userId: string, groupId: string) => {
    if (!groupId || !userId) return
    const groups = await getAllGroups()
    const group = groups.find((g) => g.id === groupId)
    if (!group) return
    group.participants = group.participants.filter((p) => p.id !== userId)
    setCurrentGroup(group)
    updateGroup(group)
  }
  const getGroupById = async (groupId: string) => {
    if (!groupId) return null
    const groups = await getAllGroups()
    const group = groups.find((g) => g.id === groupId)
    if (!group) return null
    setCurrentGroup(group)
    return group
  }
  const addRankingToGroup = (rankings: number[]) => {
    if (!currentGroup || !currentUser) return

    console.log("GroupContext: Adding rankings to group", {
      groupId: currentGroup.id,
      userId: currentUser.id,
      rankings: rankings,
    })

    // Create a deep copy of the current group to avoid reference issues
    const group = JSON.parse(JSON.stringify(currentGroup))

    // Find the participant and update their rankings
    const participantIndex = group.participants.findIndex((p) => p.id === currentUser.id)
    if (participantIndex === -1) {
      console.error("GroupContext: Participant not found in group")
      return
    }

    // Update the rankings and ensure status is completed
    group.participants[participantIndex].rankings = rankings
    group.participants[participantIndex].status = "completed"
    group.lastUpdated = Date.now()

    console.log("GroupContext: Updated group with rankings", group)

    // Update local state and persist to server
    setCurrentGroup(group)
    updateGroup(group)

    return true
  }
  const startGroupGame = () => {
    if (!currentGroup) return false
    const group = { ...currentGroup }
    group.gameStarted = true
    setCurrentGroup(group)
    updateGroup(group)
    return true
  }
  const updateParticipantStatus = (status: "waiting" | "ranking" | "completed") => {
    if (!currentGroup || !currentUser) return false
    const group = { ...currentGroup }
    const participantIndex = group.participants.findIndex((p) => p.id === currentUser.id)
    if (participantIndex === -1) return false
    group.participants[participantIndex].status = status
    setCurrentGroup(group)
    updateGroup(group)
    return true
  }
  const isHost = () => {
    if (!currentGroup || !currentUser) return false
    return currentGroup.hostId === currentUser.id
  }
  const refreshGroup = async () => {
    if (!currentGroup) return
    const groups = await getAllGroups()
    const group = groups.find((g) => g.id === currentGroup.id)
    if (!group) return
    setCurrentGroup(group)
    setLastRefresh(Date.now())
  }

  const contextValue = {
    currentGroup,
    currentUser,
    setCurrentGroup,
    joinGroup,
    leaveGroup,
    removeUserFromGroup,
    addRankingToGroup,
    getGroupById,
    setCurrentUser,
    startGroupGame,
    updateParticipantStatus,
    isHost,
    refreshGroup,
  }

  console.log("GroupProvider: Current context state:", {
    currentGroup,
    currentUser,
    isInitialized,
    lastRefresh,
  })

  return <GroupContext.Provider value={contextValue}>{children}</GroupContext.Provider>
}

export function useGroup() {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error("useGroup must be used within a GroupProvider")
  }
  return context
}
