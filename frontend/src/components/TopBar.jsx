import { Menu, Bell, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getHealth } from '../api'

export default function TopBar({ onMenuClick, title }) {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    const check = () =>
      getHealth()
        .then(() => setOnline(true))
        .catch(() => setOnline(false))
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-semibold text-gray-800 text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {online === null ? null : online ? (
          <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <Wifi size={13} /> API Online
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
            <WifiOff size={13} /> API Offline
          </span>
        )}
      </div>
    </header>
  )
}

