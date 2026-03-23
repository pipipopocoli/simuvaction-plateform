// User types matching the Prisma schema
export type UserRole = 'delegate' | 'journalist' | 'leader' | 'lobbyist' | 'admin' | 'game_master';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: string | null;
  eventId: string;
  avatarUrl: string | null;
  countryCode: string | null;
  timezone: string | null;
  team?: Team | null;
}

export interface Team {
  id: string;
  countryCode: string;
  countryName: string;
  stance: string | null;
  priorities: string | null;
}

// Chat types
export type ChatRoomType = 'global' | 'team' | 'private' | 'direct';

export interface ChatRoom {
  id: string;
  name: string;
  roomType: ChatRoomType;
  eventId: string;
  createdAt: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  members?: ChatMember[];
  _count?: { messages: number; memberships: number };
}

export interface ChatMember {
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'>;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  replyToId: string | null;
  createdAt: string;
  deletedAt: string | null;
  sender: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'> & { countryCode?: string | null };
  replyTo?: Pick<ChatMessage, 'id' | 'body' | 'sender'> | null;
}

// Vote types
export type VoteStatus = 'draft' | 'open' | 'active' | 'closed' | 'cancelled';
export type BallotMode = 'per_person' | 'per_delegation';
export type VoteVisibility = 'public' | 'secret';

export interface Vote {
  id: string;
  title: string;
  description: string | null;
  status: VoteStatus;
  ballotMode: BallotMode;
  visibility: VoteVisibility;
  showLiveResults: boolean;
  quorumPercent: number | null;
  eventId: string;
  createdAt: string;
  closedAt: string | null;
  options: VoteOption[];
  hasVoted?: boolean;
  totalVotes?: number;
}

export interface VoteOption {
  id: string;
  label: string;
  voteCount?: number;
}

// News types
export type NewsStatus = 'draft' | 'pending_approval' | 'published' | 'rejected';

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  status: NewsStatus;
  authorId: string;
  eventId: string;
  createdAt: string;
  publishedAt: string | null;
  author: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'>;
  approvals?: NewsApproval[];
}

export interface NewsApproval {
  id: string;
  approved: boolean;
  approverRole: string;
  approver: Pick<User, 'id' | 'name'>;
}

// Meeting types
export type MeetingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface MeetingRequest {
  id: string;
  title: string;
  description: string | null;
  proposedTime: string;
  duration: number;
  status: MeetingRequestStatus;
  createdAt: string;
  requester: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'>;
  googleMeetUrl: string | null;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  readAt: string | null;
  createdAt: string;
}

// Auth types
export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: string | null;
  eventId: string;
  avatarUrl: string | null;
}
