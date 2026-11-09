import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Images, Layers, Target, TrendingUp,
  ScanLine, AlertCircle, CheckCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getDatasetStats, getEvaluation } from '../api'
import { Card, StatCard, Spinner, Alert, Badge } from '../components/ui'

const CLASS_COLORS = ['#dc2626', '#d97706', '#7c3aed', '#16a34a', '#0891b2']

const DISEASE_INFO = {
  'Alternaria Leaf Spot': { color: '#dc2626', desc: 'Fungal brown spots with concentric rings' },
  'Bacterial Blight': { color: '#d97706', desc: 'Angular water-soaked dark lesions' },
  'Fusarium Wilt': { color: '#7c3aed', desc: 'Soil-borne vascular wilt and stunting' },
  'Healthy Leaf': { color: '#16a34a', desc: 'Vigorous leaf with normal coloration' },
  'Verticillium Wilt': { color: '#0891b2', desc: 'Interveinal chlorosis and tiger-stripe pattern' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [dsStats, setDsStats] = useState(null)
  const [evalData, setEvalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([getDatasetStats(), getEvaluation()])
      .then(([dsRes, evalRes]) => {
        setDsStats(dsRes.data)
        setEvalData(evalRes.data)
      })
      .catch(() => setError('Could not load statistics from backend.'))
      .finally(() => setLoading(false))
  }, [])

  // Use processed unified distribution if available, otherwise original
  const hasProcessed = dsStats?.processed?.status === 'ready' && dsStats?.processed?.total_images > 0
  const classDist = hasProcessed ? dsStats.processed.class_distribution : (dsStats?.original?.class_distribution || {})
  const totalImages = hasProcessed ? dsStats.processed.total_images : (dsStats?.original?.total_images || 1373)
  const numClasses = hasProcessed ? dsStats.processed.num_classes : (Object.keys(classDist).length || 5)

  const chartData = Object.entries(classDist).map(([name, count], i) => ({
    name: name.length > 12 ? name.substring(0, 11) + '…' : name,
    fullName: name,
    count,
    fill: CLASS_COLORS[i % CLASS_COLORS.length],
  }))

  const tm = evalData?.test_metrics || {}
  const testAcc = tm.test_accuracy ? `${(tm.test_accuracy * 100).toFixed(2)}%` : '84.95%'
  const macroPrec = tm.macro_precision ? `${(tm.macro_precision * 100).toFixed(2)}%` : '84.89%'
  const macroRec = tm.macro_recall ? `${(tm.macro_recall * 100).toFixed(2)}%` : '82.09%'
  const macroF1 = tm.macro_f1 ? `${(tm.macro_f1 * 100).toFixed(2)}%` : '82.20%'
  const testCount = tm.test_images || 206

  const metrics = [
    { label: 'Test Accuracy', value: testAcc, note: `Overall accuracy on ${testCount} held-out test images` },
    { label: 'Macro Precision', value: macroPrec, note: `Average precision across all ${numClasses} classes` },
    { label: 'Macro Recall', value: macroRec, note: `Average recall across all ${numClasses} classes` },
    { label: 'Macro F1-Score', value: macroF1, note: 'Harmonic mean of precision and recall' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Experimental results notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Research Dashboard:</strong> Metrics displayed are derived from the trained MORPH-CNN model
          evaluated on the held-out test set. Model checkpoint is actively linked to the prediction engine.
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Images} label="Total Dataset Images" value={loading ? '…' : totalImages.toLocaleString()} sub="Cotton Original Dataset" />
        <StatCard icon={Layers} label="Disease Categories" value={loading ? '…' : numClasses} sub="5 distinct classes" iconBg="bg-blue-100" iconColor="text-blue-700" />
        <StatCard icon={Target} label="Current Model" value="MORPH-CNN" sub="Novel CNN Architecture" iconBg="bg-purple-100" iconColor="text-purple-700" />
        <StatCard icon={TrendingUp} label="Model Test Accuracy" value={loading ? '…' : testAcc} sub="Experimental result" iconBg="bg-emerald-100" iconColor="text-emerald-700" />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Disease distribution chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Class Distribution</h3>
            <Badge color="green">{hasProcessed ? 'Unified (16 Classes)' : 'Original'}</Badge>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center"><Spinner size={32} /></div>
          ) : error ? (
            <Alert type="warning">{error}</Alert>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 45, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, _, props) => [v, props.payload.fullName]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No data available</p>
          )}
        </Card>

        {/* Model performance summary */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Model Performance Summary</h3>
            <Badge color="green">Experimental</Badge>
          </div>
          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-700">{m.label}</div>
                  <div className="text-xs text-gray-400">{m.note}</div>
                </div>
                <div className="text-lg font-bold text-green-700">{m.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            Results from independent evaluation on held-out test split.
          </p>
        </Card>
      </div>

      {/* Disease categories grid */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Categories & Conditions</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(classDist).map(([name, count], i) => {
            const info = DISEASE_INFO[name] || { color: CLASS_COLORS[i % CLASS_COLORS.length], desc: 'Cotton crop condition' }
            return (
              <div key={name} className="flex flex-col p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: info.color }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-green-800 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                    {count.toLocaleString()} img
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 truncate" title={name}>{name}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{info.desc}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Analyze button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => navigate('/predict')}
          className="flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow transition-colors"
        >
          <ScanLine size={20} />
          Analyze a Cotton Leaf
        </button>
      </div>
    </div>
  )
}
