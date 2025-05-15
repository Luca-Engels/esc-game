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

// GET /api/groups/[id]
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }>}
) {
    const { id } = await props.params;
    const groups = await fetch('/api/groups')
    const data = await groups.json();
    const group = data.find((g: Group) => g.id === id);

    if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json(group);
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }>}
) {
    const { id } = await props.params;
    console.log("id",id)
    const groups = await (await fetch('/api/groups')).json()
    const group = groups.find((g) => g.id === id);
    if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    const { name, participants, gameStarted } = await req.json();
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
    const response = await fetch('/api/groups', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(group),
    });
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
    return NextResponse.json(group);
}

// PUT /api/groups 
export async function POST(
    req: NextRequest
) {
    // get name from request body
    // create uuid for the group
    const { name,hostId } = await req.json();
    const groups = await (await fetch('/api/groups')).json()
    if (!name) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }
    if (!hostId) {
        return NextResponse.json({ error: 'Host ID is required' }, { status: 400 });
    }
    const id = crypto.randomUUID();

    const newGroup:Group = { id, name , participants:[], createdAt: Date.now(), hostId, gameStarted: false, lastUpdated: Date.now() };
    groups.push(newGroup);
    return NextResponse.json(newGroup);
}

// DELETE /api/groups/[id]
export async function DELETE(
    req: NextRequest
) {
    const { id } = await req.json();
    const groups = await (await fetch('/api/groups')).json()
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