export interface GroupMember {
  id: string;
  name: string;
  seedVenues: string[];
  seedArtists: string[];
}

export interface Group {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  members: GroupMember[];
}
