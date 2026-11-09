import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { getEvaluation } from '../api'
import { Card, Spinner, Alert, Badge } from '../components/ui'
import { AlertCircle, TrendingUp } from 'lucide-react'

const CLASS_COLORS = {
  'Alternaria Leaf Spot': '#dc2626',
  'Aphids': '#ea580c',
  'Armyworm': '#c2410c',
  'Bacterial Blight': '#d97706',
  'Cotton Boll Rot': '#b45309',
  'Cotton Leaf Curl Virus': '#eab308',
  'Fusarium Wilt': '#7c3aed',
  'Green Cotton Boll': '#15803d',
  'Healthy Leaf': '#16a34a',
  'Herbicide Growth Damage': '#ca8a04',
  'Leaf Hopper Jassids': '#059669',
  'Leaf Redding': '#b91c1c',
  'Leaf Variegation': '#0d9488',
  'Powdery Mildew': '#6366f1',
  'Target Spot': '#8b5cf6',
  'Verticillium Wilt': '#0891b2',
}

function MetricCard({ label, value, sub, color = 'green' }) {
  const textColor = { green: 'text-green-700', blue: 'text-blue-700', purple: 'text-purple-700', red: 'text-red-700' }
  return (
    <Card className="p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${textColor[color] || textColor.green}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </Card>
  )
}

export default function Performance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getEvaluation()
      .then((r) => setData(r.data))
      .catch(() => setError('Could not load evaluation data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Spinner size={40} />
      </div>
    )
  }

  const tm = data?.test_metrics || {}
  const history = data?.training_history || []
  const classReport = data?.classification_report || []
  const cmUrl = data?.confusion_matrix_url

  const pct = (v) => v ? `${(v * 100).toFixed(2)}%` : '—'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Experimental Results:</strong> All metrics shown are from offline evaluation on the
          held-out test set ({tm.test_images || 206} images across 5 disease categories). These are verified experimental results from model evaluation.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Test Accuracy" value={pct(tm.test_accuracy)} sub={`${tm.test_images || 206} test images`} color="green" />
        <MetricCard label="Macro Precision" value={pct(tm.macro_precision)} sub="Avg across 5 classes" color="blue" />
        <MetricCard label="Macro Recall" value={pct(tm.macro_recall)} sub="Avg across 5 classes" color="purple" />
        <MetricCard label="Macro F1-Score" value={pct(tm.macro_f1)} sub="Harmonic mean" color="red" />
      </div>

      {/* Training history charts */}
      {history.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Accuracy over Epochs</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={history} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fontSize: 12 }} />
                <YAxis domain={[0.5, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(2)}%`} />
                <Legend />
                <Line type="monotone" dataKey="train_accuracy" name="Train Acc" stroke="#166534" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="val_accuracy" name="Val Acc" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Loss over Epochs</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={history} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toFixed(4)} />
                <Legend />
                <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Class-wise classification report */}
      {classReport.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Class-wise Classification Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-2 text-gray-500 font-medium">Class</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Precision</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Recall</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">F1-Score</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Support</th>
                </tr>
              </thead>
              <tbody>
                {classReport.map((row) => (
                  <tr key={row.class} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CLASS_COLORS[row.class] || '#6b7280' }}
                        />
                        {row.class}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-medium">{(row.precision * 100).toFixed(2)}%</td>
                    <td className="py-2.5 text-right font-medium">{(row.recall * 100).toFixed(2)}%</td>
                    <td className="py-2.5 text-right font-medium">{(row.f1_score * 100).toFixed(2)}%</td>
                    <td className="py-2.5 text-right text-gray-500">{row.support}</td>
                  </tr>
                ))}
                <tr className="bg-green-50">
                  <td className="py-2.5 font-semibold text-green-800">Macro Average</td>
                  <td className="py-2.5 text-right font-bold text-green-800">{pct(tm.macro_precision)}</td>
                  <td className="py-2.5 text-right font-bold text-green-800">{pct(tm.macro_recall)}</td>
                  <td className="py-2.5 text-right font-bold text-green-800">{pct(tm.macro_f1)}</td>
                  <td className="py-2.5 text-right text-green-700">{tm.test_images}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* F1 bar chart */}
      {classReport.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Per-Class F1-Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={classReport.map((r) => ({ name: r.class.split(' ').slice(-1)[0], f1: parseFloat((r.f1_score * 100).toFixed(2)), color: CLASS_COLORS[r.class] || '#6b7280' }))}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="f1" name="F1-Score" radius={[4, 4, 0, 0]}>
                {classReport.map((r) => (
                  <Cell key={r.class} fill={CLASS_COLORS[r.class] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Confusion matrix */}
      {cmUrl && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Confusion Matrix</h3>
          <div className="flex justify-center">
            <img
              src={cmUrl}
              alt="MORPH-CNN Confusion Matrix"
              className="max-w-full rounded-lg border border-gray-200"
              style={{ maxHeight: 500 }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Confusion matrix from evaluation on 206 held-out test images across 5 classes.
          </p>
        </Card>
      )}

      {/* Raw report */}
      {data?.classification_report_raw && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Raw Classification Report</h3>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto font-mono">
            {data.classification_report_raw}
          </pre>
        </Card>
      )}
    </div>
  )
}

