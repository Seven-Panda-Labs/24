import type { ReactNode } from 'react'

const ILLUSTRATIONS = {
  search: '/illustrations/elf-search.webp',
  cocoa: '/illustrations/cocoa.webp',
  ready: '/illustrations/elf-ready.webp',
  packing: '/illustrations/elf-packing.webp',
}

export default function EmptyState({
  illustration,
  title,
  children,
}: {
  illustration: keyof typeof ILLUSTRATIONS
  title: string
  children?: ReactNode
}) {
  return (
    <div className="card mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
      <img src={ILLUSTRATIONS[illustration]} alt="" width={160} height={160} />
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {children}
    </div>
  )
}
