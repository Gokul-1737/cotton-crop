import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import DatasetManagement from './pages/DatasetManagement'
import Performance from './pages/Performance'
import PredictionHistory from './pages/PredictionHistory'
import About from './pages/About'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/predict': 'Disease Prediction',
  '/dataset': 'Dataset Management',
  '/performance': 'Model Performance',
  '/history': 'Prediction History',
  '/about': 'About Project',
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'MORPH-CNN'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/dataset" element={<DatasetManagement />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
