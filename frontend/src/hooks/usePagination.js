import { useState, useCallback } from 'react'
import { ITEMS_PER_PAGE } from '@/utils/constants'

export function usePagination(initialPage = 1, initialLimit = ITEMS_PER_PAGE) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / limit)

  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (page < totalPages) setPage((p) => p + 1)
  }, [page, totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) setPage((p) => p - 1)
  }, [page])

  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setPage(1)
  }, [])

  return {
    page,
    limit,
    total,
    totalPages,
    setTotal,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
    offset: (page - 1) * limit,
    from: total === 0 ? 0 : (page - 1) * limit + 1,
    to: Math.min(page * limit, total),
  }
}
