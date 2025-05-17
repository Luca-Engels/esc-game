"use client"

import { getAllGroups, updateGroup } from "@/app/groups/actions"
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
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
    const groups = await getAllGroups()
    const group = groups.find((g) => g.id === groupId)
    if (!group) return false
    const userId = uuidv4()
    const newParticipant: Participant = {
      id: userId,
      name: userName,
      rankings: [],
      timestamp: Date.now(),
      status: "waiting",
    }
    group.participants.push(newParticipant)
    setCurrentGroup(group)
    setCurrentUser({ id: userId, name: userName })
    localStorage.setItem("currentGroup", JSON.stringify(group))
    localStorage.setItem("currentUser", JSON.stringify(newParticipant))
    updateGroup( group)
    return true
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
    updateGroup( group)
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
    const group = { ...currentGroup }
    const participantIndex = group.participants.findIndex((p) => p.id === currentUser.id)
    if (participantIndex === -1) return
    group.participants[participantIndex].rankings = rankings
    setCurrentGroup(group)
    updateGroup( group)
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
    updateGroup( group)
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
