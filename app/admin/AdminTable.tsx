'use client'

import { useState } from 'react'
import { adminUpdateEmail, adminUpdatePassword, adminDeleteUser } from './actions'
import { Loader2, Settings, AlertCircle, KeyRound, Mail, Trash2, X, CheckCircle2 } from 'lucide-react'

export function AdminTable({ users }: { users: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  
  // Form States
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const openModal = (user: any) => {
    setSelectedUser(user)
    setNewEmail(user.email)
    setNewPassword('')
    setMessage(null)
  }

  const handleUpdateEmail = async () => {
    setLoading(true)
    setMessage(null)
    const res = await adminUpdateEmail(selectedUser.id, newEmail)
    if (res.error) setMessage({ type: 'error', text: res.error })
    else {
      setMessage({ type: 'success', text: 'Email updated successfully!' })
      setSelectedUser({ ...selectedUser, email: newEmail })
    }
    setLoading(false)
  }

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setLoading(true)
    setMessage(null)
    const res = await adminUpdatePassword(selectedUser.id, newPassword)
    if (res.error) setMessage({ type: 'error', text: res.error })
    else {
      setMessage({ type: 'success', text: 'Password reset successfully!' })
      setNewPassword('')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${selectedUser.email}? This wipes their entire account.`)) return
    
    setLoading(true)
    const res = await adminDeleteUser(selectedUser.id)
    if (res.error) setMessage({ type: 'error', text: res.error })
    else {
      setSelectedUser(null)
    }
    setLoading(false)
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs sm:text-sm uppercase tracking-wider text-gray-500 font-black">
            <tr>
              <th className="px-4 sm:px-6 py-4">Account Email</th>
              <th className="px-4 sm:px-6 py-4 hidden lg:table-cell">Location</th>
              <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Sign Up Date</th>
              <th className="px-4 sm:px-6 py-4 text-center">Teams</th>
              <th className="px-4 sm:px-6 py-4 text-center">Games</th>
              <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-900 font-medium text-sm sm:text-base">
            {users.map((user, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 sm:px-6 py-4 font-bold truncate max-w-[150px] sm:max-w-xs">{user.email}</td>
                <td className="px-4 sm:px-6 py-4 hidden lg:table-cell text-gray-600 font-medium">{user.location}</td>
                <td className="px-4 sm:px-6 py-4 hidden sm:table-cell text-gray-500">{user.created}</td>
                <td className="px-4 sm:px-6 py-4 text-center">{user.teams}</td>
                <td className="px-4 sm:px-6 py-4 text-center">{user.games}</td>
                <td className="px-4 sm:px-6 py-4 text-right">
                  <button 
                    onClick={() => openModal(user)}
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors active:scale-95 text-xs sm:text-sm"
                  >
                    <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Manage</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Manage Account</h2>
              <p className="text-gray-500 font-medium mt-1 truncate pr-8">{selectedUser.email}</p>
            </div>

            {message && (
              <div className={`mb-6 p-3 rounded-xl text-sm font-bold flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              {/* Email Section */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Mail className="w-4 h-4 text-blue-600" /> Update Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                  />
                  <button 
                    onClick={handleUpdateEmail}
                    disabled={loading || newEmail === selectedUser.email}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <KeyRound className="w-4 h-4 text-orange-500" /> Force Password Reset
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium"
                  />
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={loading || !newPassword}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset'}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account Permanently
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}