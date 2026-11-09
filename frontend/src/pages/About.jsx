import { Leaf, Cpu, Database, FlaskConical, BookOpen, Layers, CheckCircle2 } from 'lucide-react'
import { Card, Badge } from '../components/ui'

const DISEASES_ALL = [
  {
    name: 'Alternaria Leaf Spot',
    pathogen: 'Alternaria spp.',
    type: 'Fungal',
    desc: 'Causes circular brown spots with concentric zonate rings and chlorotic yellow halos on older leaves.',
    color: '#dc2626',
  },
  {
    name: 'Bacterial Blight',
    pathogen: 'Xanthomonas citri pv. malvacearum',
    type: 'Bacterial',
    desc: 'Angular water-soaked leaf spots bounded by veinlets, dark lesions, and blackarm systemic symptoms.',
    color: '#d97706',
  },
  {
    name: 'Fusarium Wilt',
    pathogen: 'Fusarium oxysporum f. sp. vasinfectum',
    type: 'Soil-borne Fungal',
    desc: 'Vascular wilt pathogen causing unilateral yellowing, irreversible wilting, and dark vascular ring staining.',
    color: '#7c3aed',
  },
  {
    name: 'Healthy Leaf',
    pathogen: 'None (Asymptomatic)',
    type: 'Healthy',
    desc: 'Vigorous leaf showing intact epidermis, normal palisade mesophyll, and green chlorophyll pigmentation.',
    color: '#16a34a',
  },
  {
    name: 'Verticillium Wilt',
    pathogen: 'Verticillium dahliae',
    type: 'Soil-borne Fungal',
    desc: 'Microsclerotia-forming soil fungus causing interveinal chlorosis and necrotic tiger-stripe foliage patterns.',
    color: '#0891b2',
  },
]

export default function About() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Hero */}
      <Card className="p-8 bg-gradient-to-br from-green-900 to-green-700 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-green-600 rounded-xl p-3">
            <Leaf size={28} className="text-white" />
          </div>
          <div>
            <div className="text-green-300 text-sm font-medium mb-1">Research Project</div>
            <h1 className="text-2xl font-bold leading-snug">
              Cotton Leaf Disease Identification Using<br />
              Novel CNN Model (MORPH-CNN)
            </h1>
            <p className="text-green-200 text-sm mt-3">
              An advanced deep learning framework for comprehensive automated identification of cotton
              foliar diseases, insect pest damage, boll decay, and physiological disorders using
              morphology-guided convolutional representations.
            </p>
          </div>
        </div>
      </Card>

      {/* Overview */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-green-700" />
          <h2 className="font-semibold text-gray-800">Project Overview</h2>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            Cotton (<em>Gossypium hirsutum</em>) is one of the world's most critical agricultural fiber crops,
            yet yields are routinely compromised by fungal spots, bacterial blights, vascular wilts, begomoviruses,
            and insect pests. Timely and accurate diagnosis is critical for precision crop protection.
          </p>
          <p>
            This research presents <strong>MORPH-CNN</strong>, a custom architecture designed to capture both
            fine-grained textural pathology and macro-scale lesion morphology through custom morphological encoders
            and dynamic receptive field gating.
          </p>
        </div>
      </Card>

      {/* MORPH-CNN Architecture */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={18} className="text-green-700" />
          <h2 className="font-semibold text-gray-800">MORPH-CNN Architecture</h2>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3 mb-4">
          <p>
            Unlike generic off-the-shelf backbones, MORPH-CNN incorporates specialized architectural priors
            tailored for botanical lesion analysis:
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Stem Block', desc: 'Dual ConvBlocks (Conv2d → BatchNorm → SiLU) with MaxPool for high-resolution edge and gradient extraction from 224×224 input.' },
            { name: 'Stage 1 & 2', desc: 'Hierarchical downsampling stages with strided convolutions and ResidualRefinement blocks to capture multi-scale feature hierarchies.' },
            { name: 'Morphology Encoder', desc: 'Computes spatial statistics (mean, variance, finite-difference gradients) mapped through a 2-layer MLP to form compact morphological descriptors.' },
            { name: 'Adaptive Receptive Field (ARF)', desc: 'Triple parallel branches (3×3 standard, dilated 3×3, 5×5 wide) gated dynamically via morphology-guided softmax weights.' },
            { name: 'Morphology-Guided Modulation (MGM)', desc: 'Dual channel-and-spatial attention mechanism that modulates feature channels based on lesion texture cues.' },
            { name: 'Refinement & Classifier', desc: 'Residual refinement block followed by Global Adaptive AvgPool, dual Dropout regularization (0.4 / 0.2), and projection to target classes.' },
          ].map((c) => (
            <div key={c.name} className="border border-gray-200 rounded-xl p-4">
              <div className="font-medium text-sm text-green-800 mb-1">{c.name}</div>
              <div className="text-xs text-gray-500">{c.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono">
          Input (3×224×224) → Stem → Stage1 → Stage2 → AdaptiveRF(3 branches) → Modulation → Refinement → Pool → Classifier → Multi-Class Logits
        </div>
      </Card>

      {/* Datasets */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-green-700" />
          <h2 className="font-semibold text-gray-800">Dataset Information</h2>
        </div>
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 leading-relaxed">
            The primary research dataset contains <strong>1,373 verified cotton leaf images</strong> across 5 categories, protected in read-only storage:
          </p>
          <div className="grid sm:grid-cols-5 gap-3">
            {[
              { name: 'Alternaria Leaf Spot', count: '173 images' },
              { name: 'Bacterial Blight', count: '218 images' },
              { name: 'Fusarium Wilt', count: '337 images' },
              { name: 'Healthy Leaf', count: '333 images' },
              { name: 'Verticillium Wilt', count: '312 images' },
            ].map((ds) => (
              <div key={ds.name} className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                <div className="font-medium text-gray-800 text-xs">{ds.name}</div>
                <div className="text-sm text-green-700 font-bold mt-1">{ds.count}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Experimental results */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={18} className="text-green-700" />
          <h2 className="font-semibold text-gray-800">Existing Experimental Results</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Verified offline evaluation metrics on 206 held-out test images from the original experimental evaluation:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-xs text-green-700 font-medium">Test Accuracy</div>
            <div className="text-2xl font-bold text-green-900 mt-1">84.95%</div>
            <div className="text-xs text-green-600 mt-1">206 test images</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-xs text-blue-700 font-medium">Macro Precision</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">84.89%</div>
            <div className="text-xs text-blue-600 mt-1">Across 5 classes</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-xs text-purple-700 font-medium">Macro Recall</div>
            <div className="text-2xl font-bold text-purple-900 mt-1">82.09%</div>
            <div className="text-xs text-purple-600 mt-1">Across 5 classes</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-xs text-amber-700 font-medium">Macro F1-Score</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">82.20%</div>
            <div className="text-xs text-amber-600 mt-1">Harmonic mean</div>
          </div>
        </div>
      </Card>

      {/* Disease categories */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Five Target Disease Categories</h2>
            <p className="text-xs text-gray-400 mt-0.5">Primary botanical pathology categories identified by MORPH-CNN</p>
          </div>
          <Badge color="green">5 Classes</Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {DISEASES_ALL.map((d, i) => (
            <div key={d.name} className="flex gap-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: d.color }}
              >
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-800 text-sm truncate">{d.name}</div>
                <div className="text-xs text-gray-500 mb-1">
                  <em>{d.pathogen}</em> · <span className="text-gray-400">{d.type}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  )
}
