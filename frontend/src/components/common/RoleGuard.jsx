import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'

export default function RoleGuard({ roles, children, fallback = null }) {
  const { hasRole } = usePermissions()

  if (!hasRole(roles)) return fallback

  return children
}
