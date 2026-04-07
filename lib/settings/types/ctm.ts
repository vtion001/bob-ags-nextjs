export interface CTMAgent {
  id: string
  name: string
  uid: number
}

export interface CTMUserGroup {
  id: string
  name: string
  userIds: number[]
}

export interface CTMAssignment {
  userId: string
  email: string
  role: string
  ctmAgentId: string | null
  ctmUserGroupId: string | null
}