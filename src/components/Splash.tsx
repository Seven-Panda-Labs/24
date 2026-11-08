import Logo from './Logo.tsx'

export default function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Logo size={96} alt="24" className="animate-pulse" />
    </div>
  )
}
