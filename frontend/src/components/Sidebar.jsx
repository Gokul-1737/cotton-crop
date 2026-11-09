import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanLine,
  Database,
  BarChart2,
  History,
  Info,
  Leaf,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict', icon: ScanLine, label: 'Disease Prediction' },
  { to: '/dataset', icon: Database, label: 'Dataset Management' },
  { to: '/performance', icon: BarChart2, label: 'Model Performance' },
  { to: '/history', icon: History, label: 'Prediction History' },
  { to: '/about', icon: Info, label: 'About Project' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-green-900 text-white transition-transform duration-300
          w-64 lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-green-700">
          <div className="bg-green-600 rounded-lg p-2">
            <Leaf size={22} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">MORPH-CNN</div>
            <div className="text-green-300 text-xs">Cotton Disease AI</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium nav-link ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-green-200 hover:bg-green-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-green-700 text-green-400 text-xs">
          <div>Research Project — 2024</div>
          <div className="mt-0.5">Cotton Leaf Disease ID</div>
        </div>
      </aside>
    </>
  )
}

