import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socketInstance = null

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const socketRef = useRef(null)

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return
    if (socketInstance?.connected) {
      socketRef.current = socketInstance
      return
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('notification', (notification) => {
      addNotification(notification)
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message)
    })

    socketInstance = socket
    socketRef.current = socket
  }, [isAuthenticated, token, addNotification])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketInstance = null
      socketRef.current = null
    }
  }, [])

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler)
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }
    return () => {
      // Don't disconnect on component unmount, only on logout
    }
  }, [isAuthenticated, connect, disconnect])

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    on,
    isConnected: socketRef.current?.connected || false,
  }
}
