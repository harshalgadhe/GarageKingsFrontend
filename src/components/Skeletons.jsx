import React from 'react'

export function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-[#0D0D0D] border border-white/[0.04] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-[#0D0D0D] border border-white/[0.06] overflow-hidden min-h-[440px]">
      {/* Header bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04] bg-[#050505]/40">
        <Shimmer className="h-2.5 w-24 rounded" />
        <Shimmer className="h-3.5 w-16 rounded" />
      </div>
      {/* 4:3 Media aspect ratio block */}
      <Shimmer className="h-52 w-full flex-shrink-0" />
      {/* Plaque Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Shimmer className="h-3 w-16 rounded" />
            <Shimmer className="h-3.5 w-10 rounded" />
          </div>
          <Shimmer className="h-4 w-4/5 rounded" />
          <Shimmer className="h-3 w-2/3 rounded" />
          <Shimmer className="h-3 w-1/3 rounded" />
        </div>
        
        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <Shimmer className="h-2 w-12 rounded mb-1" />
            <Shimmer className="h-5 w-20 rounded" />
          </div>
          <Shimmer className="h-7 w-16 rounded-lg" />
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

export function ProductDetailSkeleton() {
  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-16 w-full font-mono">
      <Shimmer className="h-3.5 w-40 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: 60% gallery */}
        <div className="lg:col-span-7 space-y-4">
          <Shimmer className="aspect-[4/3] w-full rounded-xl" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="w-16 h-16 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Right: 40% acquisition panel */}
        <div className="lg:col-span-5 bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="h-8 w-4/5 rounded" />
          <Shimmer className="h-3.5 w-32 rounded" />
          <div className="p-4 bg-[#050505] rounded-lg space-y-2">
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-6 w-36 rounded" />
          </div>
          <Shimmer className="h-12 w-full rounded-lg" />
          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            {Array.from({ length: 3 }).map((_, i) => (
              <Shimmer key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderSkeleton() {
  return (
    <div className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-6 space-y-4 font-mono">
      <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
        <div className="space-y-1.5">
          <Shimmer className="h-4 w-32 rounded" />
          <Shimmer className="h-3 w-20 rounded" />
        </div>
        <Shimmer className="h-6 w-24 rounded" />
      </div>
      <div className="space-y-3">
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-5/6 rounded" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="h-5 w-32 rounded" />
          <Shimmer className="h-3.5 w-24 rounded" />
        </div>
      </div>
    </div>
  )
}

export function AdminTableSkeleton({ rows = 10, cols = 5 }) {
  return (
    <div className="w-full bg-[#0D0D0D] border border-white/[0.06] rounded-xl overflow-hidden font-mono">
      <div className="flex border-b border-white/[0.06] p-4 bg-[#050505]">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <Shimmer key={cIdx} className="h-4 flex-1 rounded mx-2" />
        ))}
      </div>
      <div className="divide-y divide-white/[0.04]">
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

export function StatisticsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-6 space-y-3">
          <Shimmer className="h-3 w-20 rounded" />
          <Shimmer className="h-8 w-28 rounded" />
          <Shimmer className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}
