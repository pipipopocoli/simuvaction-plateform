// API base URL — points to the deployed Vercel backend
// In development, use your local Next.js server
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://simuvaction-plateform.vercel.app';

export const API_ENDPOINTS = {
  // Auth
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  resetPassword: '/api/auth/reset',

  // Profile
  profile: '/api/profile',
  settingsProfile: '/api/settings/profile',
  profileAvatar: '/api/settings/profile/avatar',

  // Chat
  chatRooms: '/api/chat/rooms',
  chatMessages: (roomId: string) => `/api/chat/${roomId}/messages`,
  chatContacts: '/api/chat/contacts',

  // Votes
  votes: '/api/votes',
  vote: (voteId: string) => `/api/votes/${voteId}`,
  castVote: (voteId: string) => `/api/votes/${voteId}/cast`,

  // News
  news: '/api/news',
  newsItem: (id: string) => `/api/news/${id}`,
  newsApprove: (id: string) => `/api/news/${id}/approve`,
  liveWire: '/api/news/live-wire',

  // Meetings
  meetingRequests: '/api/meetings/requests',
  meetingRequest: (id: string) => `/api/meetings/requests/${id}`,
  meetingsNext: '/api/meetings/next',

  // Notifications
  notifications: '/api/notifications',
  registerDevice: '/api/notifications/register-device',

  // Directory
  directory: '/api/directory',

  // Teams
  teams: '/api/teams',
  teamProfile: '/api/teams/profile',
} as const;
