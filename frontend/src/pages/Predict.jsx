import { useState, useRef, useCallback } from 'react'
import { Upload, X, ScanLine, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { predictDisease } from '../api'
import { Card, Spinner, Alert, Badge } from '../components/ui'

const CLASS_COLORS = {
  'Alternaria Leaf Spot': '#dc2626',
  'Bacterial Blight': '#d97706',
  'Fusarium Wilt': '#7c3aed',
  'Healthy Leaf': '#16a34a',
  'Verticillium Wilt': '#0891b2',
}

const CLASS_DESCRIPTIONS = {
  'Alternaria Leaf Spot': 'Fungal disease causing circular to irregular brown lesions on cotton leaves, often with concentric rings and yellow halos.',
  'Bacterial Blight': 'Bacterial infection causing angular, water-soaked leaf lesions that turn dark brown to black; spreads rapidly in high humidity.',
  'Fusarium Wilt': 'Soil-borne vascular wilt fungus causing chlorosis, wilting, stunting, and distinct dark vascular discoloration.',
  'Healthy Leaf': 'No visible disease symptoms or pathogen lesions. Normal vigorous green pigmentation and intact leaf venation.',
  'Verticillium Wilt': 'Soil-borne vascular pathogen producing characteristic interveinal chlorotic mottle and tiger-stripe necrosis patterns.',
}

function DropZone({ onFile, disabled }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-10 flex flex-col items-center cursor-pointer transition-all
        ${dragging ? 'border-green-600 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Upload size={36} className="text-gray-400 mb-3" />
      <p className="text-gray-600 font-medium">Drop a cotton leaf image here</p>
      <p className="text-gray-400 text-sm mt-1">or click to browse</p>
      <p className="text-gray-400 text-xs mt-3">Supports JPG, JPEG, PNG</p>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}

function ProbabilityBar({ name, probability, isTop }) {
  const pct = Math.round(probability * 100 * 100) / 100
  const color = CLASS_COLORS[name] || '#6b7280'
  return (
    <div className={`py-2 ${isTop ? 'bg-green-50 rounded-lg px-3 -mx-3' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-medium ${isTop ? 'text-green-800' : 'text-gray-700'}`}>
          {name}
          {isTop && <span className="ml-2 text-xs bg-green-200 text-green-800 rounded-full px-2 py-0.5">Top</span>}
        </span>
        <span className={`text-sm font-bold ${isTop ? 'text-green-800' : 'text-gray-600'}`}>
          {pct.toFixed(2)}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function Predict() {
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    if (!/\.(jpg|jpeg|png)$/i.test(file.name)) {
      setError('Please upload a JPG, JPEG, or PNG image.')
      return
    }
    setError(null)
    setResult(null)
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', imageFile)
      const res = await predictDisease(fd)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImageFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const sortedProbs = result
    ? Object.entries(result.class_probabilities).sort((a, b) => b[1] - a[1])
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Upload Cotton Leaf Image</h3>

          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img
                src={preview}
                alt="Uploaded leaf"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <DropZone onFile={handleFile} disabled={loading} />
          )}

          {error && <Alert type="error">{error}</Alert>}

          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!imageFile || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? <Spinner size={18} /> : <ScanLine size={18} />}
              {loading ? 'Analyzing…' : 'Analyze Image'}
            </button>
            {(imageFile || result) && (
              <button
                onClick={handleReset}
                className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Uses the trained MORPH-CNN model for inference on CPU.
          </p>
        </Card>

        {/* Result panel */}
        <Card className="p-5">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <ScanLine size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">No result yet</p>
              <p className="text-gray-300 text-sm mt-1">Upload an image and click Analyze</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center py-10">
              <Spinner size={40} />
              <p className="text-gray-500 mt-4 font-medium">Running MORPH-CNN inference…</p>
              <p className="text-gray-400 text-sm mt-1">This may take a few seconds on CPU</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Prediction header */}
              <div
                className="rounded-xl p-4 text-white"
                style={{ backgroundColor: CLASS_COLORS[result.predicted_class] || '#166534' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium opacity-90">Predicted Disease</span>
                </div>
                <div className="text-2xl font-bold">{result.predicted_class}</div>
                <div className="text-sm mt-1 opacity-90">
                  Confidence: {result.confidence_pct}%
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {CLASS_DESCRIPTIONS[result.predicted_class]}
              </p>

              {/* Probability breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Class Probability Distribution</h4>
                <div className="space-y-1">
                  {sortedProbs.map(([name, prob]) => (
                    <ProbabilityBar
                      key={name}
                      name={name}
                      probability={prob}
                      isTop={name === result.predicted_class}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                Probabilities sum to ~100%. Prediction saved to history.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

