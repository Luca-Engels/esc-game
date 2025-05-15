import { Group } from "@/contexts/group-context";

export async function createGroup(groupName: string, hostId: string) {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: groupName,hostId:hostId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create group');
  }

  const data = await response.json();
  return data;
}

export async function updateGroup(groupData: Partial<Group>) {
  const response = await fetch(`/api/groups/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(groupData),
  });
    if (!response.ok) {
        throw new Error('Failed to update group');
    }
    const data = await response.json();
    return data;
}

export async function getAllGroups() {
  const response = await fetch('/api/groups', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }

  const data = await response.json();
  return data;
}


export async function getGroupById(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch group');
  }

  const data = await response.json();
  return data;
}