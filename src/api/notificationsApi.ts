import { apiClient } from '@/utils/apiClient'

export interface FlowNotificationItem {
  id: string
  title: string
  content?: string
  type: string
  read?: boolean
  isRead?: boolean
  createdAt?: string
}

export async function fetchBusinessNotifications(page = 1, pageSize = 5) {
  const res = await apiClient.get<{
    items: FlowNotificationItem[]
    total: number
  }>('/business/notifications', {
    params: { page, pageSize },
  })
  return res.data ?? { items: [], total: 0 }
}
