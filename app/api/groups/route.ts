import { NextRequest, NextResponse } from 'next/server';
import { Participant} from "@/contexts/group-context";
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
export const groups: Group[] = [];

// GET /api/groups/[id]
export async function GET(
    req: NextRequest
) {
    console.log(groups)
    return NextResponse.json(groups);
}

// PUT /api/groups 
export async function POST(
    req: NextRequest
) {
    // get name from request body
    // create uuid for the group
    const { name,hostId } = await req.json();
    if (!name) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }
    if (!hostId) {
        return NextResponse.json({ error: 'Host ID is required' }, { status: 400 });
    }
    const id = crypto.randomUUID();

    const newGroup:Group = { id, name , participants:[], createdAt: Date.now(), hostId, gameStarted: false, lastUpdated: Date.now() };
    groups.push(newGroup);
    console.log(groups)
    return NextResponse.json(newGroup);
}

export async function PUT(
    req: NextRequest
) {
    const { name, participants, gameStarted,id } = await req.json();

    const group = groups.find((g) => g.id === id);
    if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (name) {
        group.name = name;
    }
    if (participants) {
        group.participants = participants;
    }
    if (gameStarted !== undefined) {
        group.gameStarted = gameStarted;
    }
    group.lastUpdated = Date.now();
    return NextResponse.json(group);
}

// DELETE /api/groups/[id]
export async function DELETE(
    req: NextRequest
) {
    const { id } = await req.json();
    if (!id) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    const deleted = groups.splice(idx, 1)[0];
    return NextResponse.json(deleted);
}