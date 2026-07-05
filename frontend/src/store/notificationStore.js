import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    }))
  },

  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      )
      const unreadCount = notifications.filter((n) => !n.isRead).length
      return { notifications, unreadCount }
    })
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
  },

  removeNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n._id !== id)
      const unreadCount = notifications.filter((n) => !n.isRead).length
      return { notifications, unreadCount }
    })
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  },
}))
