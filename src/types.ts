export interface User {
  id: string
  username: string
  displayName: string
  bio: string
  avatarColor: string
  createdAt: string
  joinedCommunities: string[]
}

export interface Community {
  id: string
  name: string
  slug: string
  description: string
  topic: string
  creatorId: string
  memberCount: number
  createdAt: string
  color: string
}

export type MediaType = 'image' | 'video' | null

export interface Post {
  id: string
  authorId: string
  communityId: string | null
  content: string
  mediaId: string | null
  mediaType: MediaType
  mediaName: string | null
  likes: string[]
  createdAt: string
  tags: string[]
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  content: string
  parentId: string | null
  likes: string[]
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link: string | null
  actorId: string | null
  read: boolean
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt: string | null
}

export interface ConversationSummary {
  id: string
  otherUser: User
  updatedAt: string
  lastMessage: Message | null
  unread: number
}

export interface AppData {
  users: User[]
  communities: Community[]
  posts: Post[]
  comments: Comment[]
}
