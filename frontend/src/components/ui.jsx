// Shared UI primitives

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Badge({ children, color = 'green' }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700',
    orange: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.green}`}>
      {children}
    </span>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg
      className="spinner text-green-700"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }
  return (
    <div className={`border rounded-lg p-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-green-100', iconColor = 'text-green-700' }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`${iconBg} rounded-lg p-2.5`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </Card>
  )
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <Icon size={40} className="mb-3 opacity-40" />
      <p className="font-medium text-gray-500">{message}</p>
      {sub && <p className="text-sm mt-1">{sub}</p>}
    </div>
  )
}

