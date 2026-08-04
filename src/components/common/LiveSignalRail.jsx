import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCars } from '../../lib/db'

export default function LiveSignalRail() {
  const navigate = useNavigate()
  const [totalEntries, setTotalEntries] = useState(null)

  useEffect(() => {
    let active = true

    getCars({ page: 1, limit: 1, paginated: true })
      .then((data) => {
        const total = Number(data?.total)
        if (active && Number.isFinite(total)) setTotalEntries(total)
      })
      .catch(() => {
        if (active) setTotalEntries(null)
      })

    return () => { active = false }
  }, [])

  return (
    <div className="w-full overflow-hidden border-y border-white/[0.06] bg-[#090909] px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#D8BC78]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E1BD65]" />
            New additions
          </span>
          <span className="truncate text-[11px] tracking-wide text-[#A9A49C] sm:text-xs">
            Recently added models and incoming releases
          </span>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-white/[0.05] pt-3 font-mono text-[10px] text-[#74716B] sm:justify-start sm:border-0 sm:pt-0">
          {totalEntries !== null && (
            <span><strong className="text-[#F4F1EC]">{totalEntries}</strong> models</span>
          )}
          <button
            onClick={() => navigate('/marketplace')}
            className="flex cursor-pointer items-center gap-1 font-bold uppercase tracking-wider text-[#D8BC78] transition-colors hover:text-[#F4F1EC]"
          >
            View collection <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
