import { SignOutButton } from '@/components/auth/SignOutButton' // Adjust path if needed

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <SignOutButton />
      </div>
    </div>
  )
}