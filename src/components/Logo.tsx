// The navy logo stands out on the light theme, the white one on the dark theme.
export default function Logo({ size, alt = '', className = '' }: { size: number; alt?: string; className?: string }) {
  return (
    <>
      <img src="/logo.webp" alt={alt} width={size} height={size} className={`block dark:hidden ${className}`} />
      <img src="/logo-dark.webp" alt={alt} width={size} height={size} className={`hidden dark:block ${className}`} />
    </>
  )
}
