import { type NextRequest, NextResponse } from "next/server"
import type { Participant } from "@/contexts/group-context"
type Group = {
  id: string
  name: string
  participants: Participant[]
  createdAt: number
  hostId: string
  gameStarted: boolean
  lastUpdated: number
}
// Dummy in-memory data store
export const groups: Group[] = []

// GET /api/groups/[id]
export async function GET(req: NextRequest) {
  console.log(groups)
  return NextResponse.json(groups)
}

// PUT /api/groups
export async function POST(req: NextRequest) {
  // get name from request body
  // create uuid for the group
  const { name, hostId } = await req.json()
  if (!name) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 })
  }
  if (!hostId) {
    return NextResponse.json({ error: "Host ID is required" }, { status: 400 })
  }
  const id = crypto.randomUUID()

  const newGroup: Group = {
    id,
    name,
    participants: [],
    createdAt: Date.now(),
    hostId,
    gameStarted: false,
    lastUpdated: Date.now(),
  }

  // Make sure we're adding to the groups array
  groups.push(newGroup)

  console.log("API: Created new group", newGroup)
  console.log("API: Total groups now:", groups.length)

  return NextResponse.json(newGroup)
}

// Fix the PUT endpoint to properly handle the entire group object
export async function PUT(req: NextRequest) {
  const groupData = await req.json()
  const { id } = groupData

  if (!id) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
  }

  const groupIndex = groups.findIndex((g) => g.id === id)
  if (groupIndex === -1) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 })
  }

  // Update the entire group object
  groups[groupIndex] = {
    ...groups[groupIndex],
    ...groupData,
    lastUpdated: Date.now(),
  }

  console.log("API: Updated group", groups[groupIndex])
  return NextResponse.json(groups[groupIndex])
}

// DELETE /api/groups/[id]
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
  }
  const idx = groups.findIndex((g) => g.id === id)
  if (idx === -1) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 })
  }
  const deleted = groups.splice(idx, 1)[0]
  return NextResponse.json(deleted)
}
