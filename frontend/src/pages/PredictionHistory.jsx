import { useEffect, useState } from 'react'
import { Trash2, Eye, History as HistoryIcon, ChevronRight } from 'lucide-react'
import { getHistory, deletePrediction } from '../api'
import { Card, Spinner, Alert, Badge, EmptyState } from '../components/ui'

const CLASS_COLORS = {
  'Alternaria Leaf Spot': '#dc2626',
  'Bacterial Blight': '#d97706',
  'Fusarium Wilt': '#7c3aed',
  'Healthy Leaf': '#16a34a',
  'Verticillium Wilt': '#0891b2',
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function DetailModal({ record, onClose }) {
  if (!record) return null
  const probs = record.class_probabilities || {}
  const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1])
  const color = CLASS_COLORS[record.predicted_class] || '#166534'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Prediction Detail #{record.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {record.image_path && (
          <img
            src={`/uploads/${record.image_path.split(/[\\/]/).pop()}`}
            alt="Uploaded"
            className="w-full h-52 object-cover rounded-xl border border-gray-200"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )}

        <div className="rounded-xl p-4 text-white" style={{ backgroundColor: color }}>
          <div className="text-sm opacity-80 mb-1">Predicted Disease</div>
          <div className="text-xl font-bold">{record.predicted_class}</div>
          <div className="text-sm mt-1">Confidence: {(record.confidence * 100).toFixed(2)}%</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Class Probabilities</div>
          <div className="space-y-2">
            {sorted.map(([cls, prob]) => (
              <div key={cls}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className={cls === record.predicted_class ? 'font-semibold text-gray-800' : 'text-gray-600'}>{cls}</span>
                  <span className="font-medium">{(prob * 100).toFixed(2)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${prob * 100}%`, backgroundColor: CLASS_COLORS[cls] || '#166534' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400 border-t pt-3">
          <div>File: {record.filename}</div>
          <div>Date: {formatDate(record.predicted_at)}</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
        >
          Close
        </button>
      </Card>
    </div>
  )
}

export default function PredictionHistory() {
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    getHistory()
      .then((r) => {
        setRecords(r.data.records)
        setTotal(r.data.total)
      })
      .catch(() => setError('Could not load prediction history.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this prediction record?')) return
    try {
      await deletePrediction(id)
      load()
    } catch {
      alert('Delete failed.')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Prediction History</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} predictions stored in local SQLite database</p>
        </div>
        <button onClick={load} className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner size={36} /></div>
      ) : records.length === 0 ? (
        <Card>
          <EmptyState
            icon={HistoryIcon}
            message="No predictions yet"
            sub="Upload a cotton leaf image to get started"
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {records.map((rec) => {
              const color = CLASS_COLORS[rec.predicted_class] || '#166534'
              const confPct = (rec.confidence * 100).toFixed(1)
              return (
                <div
                  key={rec.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Color dot */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {rec.predicted_class[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{rec.predicted_class}</div>
                    <div className="text-xs text-gray-400 truncate">{rec.filename}</div>
                    <div className="text-xs text-gray-400">{formatDate(rec.predicted_at)}</div>
                  </div>

                  {/* Confidence badge */}
                  <div className="text-sm font-bold" style={{ color }}>
                    {confPct}%
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelected(rec)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

