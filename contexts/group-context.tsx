"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"

// Types for our group functionality
export type Participant = {
  id: string
  name: string
  rankings: number[]
  timestamp: number
  status: "waiting" | "ready" | "completed"
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
  createGroup: (name: string) => string
  joinGroup: (groupId: string, userName: string) => boolean
  leaveGroup: () => void
  removeUserFromGroup: (userId: string, groupId: string) => void
  addRankingToGroup: (rankings: number[]) => void
  getGroupById: (groupId: string) => Group | null
  getAllGroups: () => Group[]
  createAndJoinGroup: (groupName: string, userName: string) => string | null
  startGroupGame: () => boolean
  updateParticipantStatus: (status: "waiting" | "ready" | "completed") => boolean
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

// Helper function to safely stringify and save to localStorage
const safelySaveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`Error saving to localStorage (${key}):`, e)
    return false
  }
}

// Create a shared storage key for groups that will be consistent across all instances
const SHARED_GROUPS_KEY = "eurovision-shared-groups"

export function GroupProvider({ children }: { children: ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  // Use a ref to track if we're in the process of creating a group
  // This prevents the beforeunload handler from removing the user during group creation
  const isCreatingGroup = useRef(false)

  // Use a ref to track if we're in the process of joining a group
  const isJoiningGroup = useRef(false)

  // Load groups from localStorage on initial render
  useEffect(() => {
    console.log("GroupProvider: Initializing from localStorage")
    if (typeof window !== "undefined") {
      try {
        const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
        console.log("GroupProvider: Stored groups from localStorage:", storedGroups)

        if (storedGroups) {
          const parsedGroups = safelyParseJSON(storedGroups, [])
          console.log("GroupProvider: Parsed groups:", parsedGroups)
          setGroups(parsedGroups)
        }

        // Use sessionStorage for user session data instead of localStorage
        // This will automatically clear when the browser is closed
        const storedGroupId = sessionStorage.getItem("currentEurovisionGroupId")
        const storedUserId = sessionStorage.getItem("eurovisionUserId")
        const storedUserName = sessionStorage.getItem("eurovisionUserName")

        console.log("GroupProvider: Stored user/group info:", {
          storedGroupId,
          storedUserId,
          storedUserName,
        })

        if (storedGroupId && storedUserId && storedUserName) {
          const storedGroupsArray = storedGroups ? safelyParseJSON(storedGroups, []) : []
          const group = storedGroupsArray.find((g: Group) => g.id === storedGroupId)

          if (group) {
            console.log("GroupProvider: Found current group:", group)
            setCurrentGroup(group)
            setCurrentUser({ id: storedUserId, name: storedUserName })
          } else {
            console.log("GroupProvider: Current group not found in stored groups")
            // Clear invalid stored data
            sessionStorage.removeItem("currentEurovisionGroupId")
            sessionStorage.removeItem("eurovisionUserId")
            sessionStorage.removeItem("eurovisionUserName")
          }
        }
      } catch (e) {
        console.error("GroupProvider: Error initializing from localStorage:", e)
        // Reset storage if there's an error
        localStorage.removeItem(SHARED_GROUPS_KEY)
        sessionStorage.removeItem("currentEurovisionGroupId")
        sessionStorage.removeItem("eurovisionUserId")
        sessionStorage.removeItem("eurovisionUserName")
      } finally {
        setIsInitialized(true)
      }
    }
  }, [])

  // Set up beforeunload event to remove user from group when leaving the site
  useEffect(() => {
    if (typeof window !== "undefined" && currentUser && currentGroup) {
      const handleBeforeUnload = () => {
        // Don't remove user if we're in the process of creating or joining a group
        if (isCreatingGroup.current || isJoiningGroup.current) {
          console.log("GroupProvider: Skipping user removal during group creation/joining")
          return
        }

        console.log("GroupProvider: User is leaving the site, removing from group")
        removeUserFromGroup(currentUser.id, currentGroup.id)
      }

      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [currentUser, currentGroup])

  // Refresh group data periodically (simulating real-time updates)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentGroup && typeof window !== "undefined") {
        try {
          const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
          if (storedGroups) {
            const parsedGroups = safelyParseJSON(storedGroups, [])
            const updatedGroup = parsedGroups.find((g: Group) => g.id === currentGroup.id)

            if (updatedGroup && updatedGroup.lastUpdated > (currentGroup.lastUpdated || 0)) {
              console.log("GroupProvider: Group updated from refresh:", updatedGroup)
              setCurrentGroup(updatedGroup)
            } else if (!updatedGroup) {
              // Group was deleted, leave the group
              console.log("GroupProvider: Group no longer exists, leaving group")
              leaveGroup()
            }
          }
        } catch (e) {
          console.error("GroupProvider: Error refreshing group data:", e)
        }
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(intervalId)
  }, [currentGroup])

  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      console.log("GroupProvider: Saving groups to localStorage:", groups)
      safelySaveToLocalStorage(SHARED_GROUPS_KEY, groups)
    }
  }, [groups, isInitialized])

  // Force a refresh of the current group
  const refreshGroup = () => {
    if (currentGroup && typeof window !== "undefined") {
      try {
        const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
        if (storedGroups) {
          const parsedGroups = safelyParseJSON(storedGroups, [])
          const updatedGroup = parsedGroups.find((g: Group) => g.id === currentGroup.id)

          if (updatedGroup) {
            // Only update if the group has actually changed
            if (updatedGroup.lastUpdated > currentGroup.lastUpdated) {
              console.log("GroupProvider: Group updated from manual refresh:", updatedGroup)
              setCurrentGroup(updatedGroup)
            }
          } else {
            // Group was deleted, leave the group
            console.log("GroupProvider: Group no longer exists, leaving group")
            leaveGroup()
          }
        }
      } catch (e) {
        console.error("GroupProvider: Error in manual refresh:", e)
      }
    }

    setLastRefresh(Date.now())
  }

  // Check if current user is the host
  const isHost = (): boolean => {
    if (!currentGroup || !currentUser) return false
    return currentGroup.hostId === currentUser.id
  }

  // Create a new group
  const createGroup = (name: string): string => {
    console.log("GroupProvider: Creating new group with name:", name)
    const groupId = uuidv4()

    const newGroup: Group = {
      id: groupId,
      name,
      participants: [],
      createdAt: Date.now(),
      hostId: "", // Will be set when joining
      gameStarted: false,
      lastUpdated: Date.now(),
    }

    console.log("GroupProvider: New group created:", newGroup)

    // Update state with the new group
    setGroups((prevGroups) => {
      const updatedGroups = [...prevGroups, newGroup]
      console.log("GroupProvider: Updated groups after creation:", updatedGroups)

      // Save immediately to ensure it's available for joining
      if (typeof window !== "undefined") {
        console.log("GroupProvider: Saving updated groups to localStorage")
        safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
      }

      return updatedGroups
    })

    return groupId
  }

  // Join an existing group
  const joinGroup = (groupId: string, userName: string): boolean => {
    console.log("GroupProvider: Joining group", { groupId, userName })

    // Set the joining flag to prevent beforeunload from removing the user
    isJoiningGroup.current = true

    try {
      // Get the latest groups from localStorage to ensure we have the most up-to-date data
      let currentGroups = groups
      if (typeof window !== "undefined") {
        const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
        if (storedGroups) {
          currentGroups = safelyParseJSON(storedGroups, [])
        }
      }

      // Find the group in our current state
      const group = currentGroups.find((g) => g.id === groupId)

      if (!group) {
        console.error("GroupProvider: Group not found for ID:", groupId)
        console.log("GroupProvider: Available groups:", currentGroups)
        isJoiningGroup.current = false
        return false
      }

      console.log("GroupProvider: Found group to join:", group)

      const userId = uuidv4()

      // Update state
      setCurrentUser({ id: userId, name: userName })

      // Add participant to the group
      const updatedGroup = { ...group }

      // Add the participant to the group
      const newParticipant: Participant = {
        id: userId,
        name: userName,
        rankings: [],
        timestamp: Date.now(),
        status: "waiting",
      }

      updatedGroup.participants = [...updatedGroup.participants.filter((p) => p.id !== userId), newParticipant]
      updatedGroup.lastUpdated = Date.now()

      // Update the groups array
      const updatedGroups = currentGroups.map((g) => (g.id === groupId ? updatedGroup : g))
      setGroups(updatedGroups)
      setCurrentGroup(updatedGroup)

      // Store in sessionStorage instead of localStorage
      if (typeof window !== "undefined") {
        console.log("GroupProvider: Saving user/group info to sessionStorage")
        sessionStorage.setItem("currentEurovisionGroupId", groupId)
        sessionStorage.setItem("eurovisionUserId", userId)
        sessionStorage.setItem("eurovisionUserName", userName)

        // Update the groups in localStorage
        safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
      }

      console.log("GroupProvider: Successfully joined group")

      // Reset the joining flag after a short delay
      setTimeout(() => {
        isJoiningGroup.current = false
      }, 1000)

      return true
    } catch (error) {
      console.error("GroupProvider: Error joining group:", error)
      isJoiningGroup.current = false
      return false
    }
  }

  // Create and join a group in one atomic operation
  const createAndJoinGroup = (groupName: string, userName: string): string | null => {
    console.log("GroupProvider: Creating and joining group in one operation", { groupName, userName })

    try {
      // Set the flag to indicate we're creating a group
      isCreatingGroup.current = true

      // Create a new group directly
      const groupId = uuidv4()
      const userId = uuidv4()

      // Create the participant
      const newParticipant: Participant = {
        id: userId,
        name: userName,
        rankings: [],
        timestamp: Date.now(),
        status: "waiting",
      }

      const newGroup: Group = {
        id: groupId,
        name: groupName,
        participants: [newParticipant], // Add the participant directly to the group
        createdAt: Date.now(),
        hostId: userId, // Set this user as the host
        gameStarted: false,
        lastUpdated: Date.now(),
      }

      console.log("GroupProvider: New group created with participant:", newGroup)

      // Update state
      setCurrentUser({ id: userId, name: userName })
      setCurrentGroup(newGroup)

      // Get the latest groups from localStorage to ensure we have the most up-to-date data
      let currentGroups = groups
      if (typeof window !== "undefined") {
        const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
        if (storedGroups) {
          currentGroups = safelyParseJSON(storedGroups, [])
        }
      }

      // Update groups array
      const updatedGroups = [...currentGroups, newGroup]
      setGroups(updatedGroups)

      // Store in sessionStorage instead of localStorage
      if (typeof window !== "undefined") {
        console.log("GroupProvider: Saving all data to sessionStorage and localStorage")
        safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
        sessionStorage.setItem("currentEurovisionGroupId", groupId)
        sessionStorage.setItem("eurovisionUserId", userId)
        sessionStorage.setItem("eurovisionUserName", userName)
      }

      console.log("GroupProvider: Successfully created and joined group:", groupId)

      // Reset the flag after a short delay to ensure all operations are complete
      setTimeout(() => {
        isCreatingGroup.current = false
      }, 1000)

      return groupId
    } catch (error) {
      console.error("GroupProvider: Error in createAndJoinGroup:", error)
      isCreatingGroup.current = false
      return null
    }
  }

  // Start the game for all participants
  const startGroupGame = (): boolean => {
    if (!currentGroup || !currentUser) {
      console.log("GroupProvider: Cannot start game - no current group or user")
      return false
    }

    // Only the host can start the game
    if (currentGroup.hostId !== currentUser.id) {
      console.log("GroupProvider: Only the host can start the game")
      return false
    }

    console.log("GroupProvider: Starting game for group:", currentGroup.id)

    // Get the latest groups from localStorage to ensure we have the most up-to-date data
    let currentGroups = groups
    if (typeof window !== "undefined") {
      const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
      if (storedGroups) {
        currentGroups = safelyParseJSON(storedGroups, [])
      }
    }

    // Find the current group in the updated groups array
    const groupToUpdate = currentGroups.find((g) => g.id === currentGroup.id)
    if (!groupToUpdate) {
      console.log("GroupProvider: Group not found for starting game")
      return false
    }

    // Update the group
    const updatedGroup = {
      ...groupToUpdate,
      gameStarted: true,
      lastUpdated: Date.now(),
    }

    // Update state
    setCurrentGroup(updatedGroup)

    // Update groups array
    const updatedGroups = currentGroups.map((g) => (g.id === currentGroup.id ? updatedGroup : g))
    setGroups(updatedGroups)

    // Update localStorage
    if (typeof window !== "undefined") {
      safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
    }

    console.log("GroupProvider: Game started successfully")
    return true
  }

  // Update participant status
  const updateParticipantStatus = (status: "waiting" | "ready" | "completed"): boolean => {
    if (!currentGroup || !currentUser) {
      console.log("GroupProvider: Cannot update status - no current group or user")
      return false
    }

    console.log("GroupProvider: Updating participant status", {
      userId: currentUser.id,
      status,
    })

    // Get the latest groups from localStorage to ensure we have the most up-to-date data
    let currentGroups = groups
    if (typeof window !== "undefined") {
      const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
      if (storedGroups) {
        currentGroups = safelyParseJSON(storedGroups, [])
      }
    }

    // Find the current group in the updated groups array
    const groupToUpdate = currentGroups.find((g) => g.id === currentGroup.id)
    if (!groupToUpdate) {
      console.log("GroupProvider: Group not found for updating status")
      return false
    }

    // Find the participant
    const participantIndex = groupToUpdate.participants.findIndex((p) => p.id === currentUser.id)

    if (participantIndex === -1) {
      console.log("GroupProvider: Participant not found in group")
      return false
    }

    // Update the participant
    const updatedParticipants = [...groupToUpdate.participants]
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      status,
    }

    // Update the group
    const updatedGroup = {
      ...groupToUpdate,
      participants: updatedParticipants,
      lastUpdated: Date.now(),
    }

    // Update state
    setCurrentGroup(updatedGroup)

    // Update groups array
    const updatedGroups = currentGroups.map((g) => (g.id === currentGroup.id ? updatedGroup : g))
    setGroups(updatedGroups)

    // Update localStorage
    if (typeof window !== "undefined") {
      safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
    }

    console.log("GroupProvider: Status updated successfully")
    return true
  }

  // Remove a user from a group and delete the group if it becomes empty
  const removeUserFromGroup = (userId: string, groupId: string) => {
    console.log("GroupProvider: Removing user from group", { userId, groupId })

    // Skip if we're in the process of creating or joining a group
    if (isCreatingGroup.current || isJoiningGroup.current) {
      console.log("GroupProvider: Skipping user removal during group creation/joining")
      return
    }

    // Get the latest groups from localStorage to ensure we have the most up-to-date data
    let currentGroups = groups
    if (typeof window !== "undefined") {
      const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
      if (storedGroups) {
        currentGroups = safelyParseJSON(storedGroups, [])
      }
    }

    // Find the group
    const groupIndex = currentGroups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) {
      console.log("GroupProvider: Group not found for removal")
      return
    }

    const group = currentGroups[groupIndex]

    // Remove the participant
    const updatedParticipants = group.participants.filter((p) => p.id !== userId)

    // Check if the group is now empty
    if (updatedParticipants.length === 0) {
      console.log("GroupProvider: Group is now empty, deleting group")

      // Delete the group
      const updatedGroups = currentGroups.filter((g) => g.id !== groupId)
      setGroups(updatedGroups)

      // Update localStorage
      if (typeof window !== "undefined") {
        safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
      }

      return
    }

    // Update the group with the participant removed
    const updatedGroup = {
      ...group,
      participants: updatedParticipants,
      // If the host left, assign a new host
      hostId: group.hostId === userId ? updatedParticipants[0]?.id || "" : group.hostId,
      lastUpdated: Date.now(),
    }

    // Update groups array
    const updatedGroups = [...currentGroups]
    updatedGroups[groupIndex] = updatedGroup

    setGroups(updatedGroups)

    // Update localStorage
    if (typeof window !== "undefined") {
      safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
    }

    console.log("GroupProvider: User removed from group successfully")
  }

  // Leave the current group
  const leaveGroup = () => {
    console.log("GroupProvider: Leaving current group")

    // Skip if we're in the process of creating or joining a group
    if (isCreatingGroup.current || isJoiningGroup.current) {
      console.log("GroupProvider: Skipping leave group during group creation/joining")
      return
    }

    // Remove user from group if they're in one
    if (currentUser && currentGroup) {
      removeUserFromGroup(currentUser.id, currentGroup.id)
    }

    setCurrentGroup(null)
    setCurrentUser(null)

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("currentEurovisionGroupId")
      sessionStorage.removeItem("eurovisionUserId")
      sessionStorage.removeItem("eurovisionUserName")
    }
  }

  // Add a ranking to the current group
  const addRankingToGroup = (rankings: number[]) => {
    if (!currentGroup || !currentUser) {
      console.log("GroupProvider: Cannot add ranking - no current group or user")
      return
    }

    console.log("GroupProvider: Adding ranking to group", {
      groupId: currentGroup.id,
      userId: currentUser.id,
      rankings,
    })

    // Get the latest groups from localStorage to ensure we have the most up-to-date data
    let currentGroups = groups
    if (typeof window !== "undefined") {
      const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
      if (storedGroups) {
        currentGroups = safelyParseJSON(storedGroups, [])
      }
    }

    // Find the current group in the updated groups array
    const groupToUpdate = currentGroups.find((g) => g.id === currentGroup.id)
    if (!groupToUpdate) {
      console.log("GroupProvider: Group not found for adding ranking")
      return
    }

    // Find the participant
    const participantIndex = groupToUpdate.participants.findIndex((p) => p.id === currentUser.id)

    if (participantIndex === -1) {
      console.log("GroupProvider: Participant not found in group")
      return
    }

    // Update the participant
    const updatedParticipants = [...groupToUpdate.participants]
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      rankings,
      status: "completed",
      timestamp: Date.now(),
    }

    // Update the group
    const updatedGroup = {
      ...groupToUpdate,
      participants: updatedParticipants,
      lastUpdated: Date.now(),
    }

    // Update state
    setCurrentGroup(updatedGroup)

    // Update groups array
    const updatedGroups = currentGroups.map((g) => (g.id === currentGroup.id ? updatedGroup : g))
    setGroups(updatedGroups)

    // Update localStorage
    if (typeof window !== "undefined") {
      safelySaveToLocalStorage(SHARED_GROUPS_KEY, updatedGroups)
    }

    console.log("GroupProvider: Ranking added successfully")
  }

  // Get a group by ID
  const getGroupById = (groupId: string): Group | null => {
    // Get the latest groups from localStorage to ensure we have the most up-to-date data
    let currentGroups = groups
    if (typeof window !== "undefined") {
      const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
      if (storedGroups) {
        currentGroups = safelyParseJSON(storedGroups, [])
      }
    }

    const group = currentGroups.find((g) => g.id === groupId) || null
    console.log(`GroupProvider: getGroupById(${groupId})`, group)
    return group
  }

  // Get all groups
  const getAllGroups = (): Group[] => {
    // Get the latest groups from localStorage to ensure we have the most up-to-date data
    let currentGroups = groups
    if (typeof window !== "undefined") {
      const storedGroups = localStorage.getItem(SHARED_GROUPS_KEY)
      if (storedGroups) {
        currentGroups = safelyParseJSON(storedGroups, [])
        // Update the state if needed
        if (JSON.stringify(currentGroups) !== JSON.stringify(groups)) {
          setGroups(currentGroups)
        }
      }
    }

    console.log("GroupProvider: getAllGroups()", currentGroups)
    return currentGroups
  }

  const contextValue = {
    currentGroup,
    currentUser,
    createGroup,
    joinGroup,
    leaveGroup,
    removeUserFromGroup,
    addRankingToGroup,
    getGroupById,
    getAllGroups,
    createAndJoinGroup,
    startGroupGame,
    updateParticipantStatus,
    isHost,
    refreshGroup,
  }

  console.log("GroupProvider: Current context state:", {
    currentGroup,
    currentUser,
    groupsCount: groups.length,
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
