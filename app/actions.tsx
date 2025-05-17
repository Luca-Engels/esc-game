import type { Group } from "@/contexts/group-context"

// Improve the updateGroup function to ensure it sends the complete group data
export async function updateGroup(groupData: Partial<Group>) {
  console.log("actions.updateGroup: Updating group with data:", groupData)

  // Ensure we have an ID
  if (!groupData.id) {
    console.error("actions.updateGroup: Missing group ID")
    throw new Error("Group ID is required")
  }

  const response = await fetch(`/api/groups/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(groupData),
  })

  if (!response.ok) {
    console.error("actions.updateGroup: Failed to update group", await response.text())
    throw new Error("Failed to update group")
  }

  const data = await response.json()
  console.log("actions.updateGroup: Group updated successfully", data)
  return data
}

export async function createGroup(groupName: string, hostId: string) {
  console.log("actions.createGroup: Creating group", { groupName, hostId })

  try {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: groupName, hostId: hostId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("actions.createGroup: Failed to create group", errorText)
      throw new Error(`Failed to create group: ${errorText}`)
    }

    const data = await response.json()
    console.log("actions.createGroup: Group created successfully", data)
    return data
  } catch (error) {
    console.error("actions.createGroup: Error creating group", error)
    throw error
  }
}

export async function getAllGroups() {
  const response = await fetch("/api/groups", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch groups")
  }

  const data = await response.json()
  return data
}

export async function getGroupById(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch group")
  }

  const data = await response.json()
  return data
}
