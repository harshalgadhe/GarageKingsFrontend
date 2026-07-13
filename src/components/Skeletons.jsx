import { motion } from 'framer-motion'

export function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-white/[0.03] animate-pulse ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-white/5 border border-white/10 overflow-hidden h-[400px]">
      {/* Image Area Skeleton */}
      <Shimmer className="aspect-[4/3] w-full" />
      {/* Content Area Skeleton */}
      <div className="p-6 flex flex-col grow space-y-4">
        <div className="flex justify-between items-center">
          <Shimmer className="h-4 w-16 rounded" />
          <Shimmer className="h-4 w-10 rounded" />
        </div>
        <Shimmer className="h-4 w-24 rounded" />
        <Shimmer className="h-6 w-3/4 rounded" />
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between w-full">
          <div>
            <Shimmer className="h-3 w-8 mb-1 rounded" />
            <Shimmer className="h-5 w-16 rounded" />
          </div>
          <Shimmer className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}

export function MarketplaceGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export function OrderSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="space-y-1.5">
          <Shimmer className="h-4 w-32 rounded" />
          <Shimmer className="h-3 w-20 rounded" />
        </div>
          <Shimmer className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-5/6 rounded" />
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <Shimmer className="h-4 w-20 rounded" />
        <Shimmer className="h-5 w-24 rounded" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="h-5 w-32 rounded" />
          <Shimmer className="h-3.5 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="space-y-1.5">
            <Shimmer className="h-3 w-16 rounded" />
            <Shimmer className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminTableSkeleton({ rows = 10, cols = 5 }) {
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex border-b border-white/10 p-4 bg-white/[0.02]">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <Shimmer key={cIdx} className="h-4 flex-1 rounded mx-2" />
        ))}
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex p-4 items-center">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Shimmer key={cIdx} className="h-4 flex-1 rounded mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CollectionSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
          <Shimmer className="w-20 h-20 rounded-xl" />
          <Shimmer className="h-4 w-24 rounded" />
          <Shimmer className="h-3.5 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}

export function ImageSkeleton() {
  return <Shimmer className="w-full h-full rounded-xl" />
}

export function StatisticsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <Shimmer className="h-3 w-20 rounded" />
          <Shimmer className="h-8 w-28 rounded" />
          <Shimmer className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}
