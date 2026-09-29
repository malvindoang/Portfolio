import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ProjectDetail from './pages/ProjectDetail'
import PageTransition from './components/PageTransition'

function App() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:slug" element={<ProjectDetail />} />
        
        {/* GUARD: Tangkap URL /project dan /project/ secara eksplisit */}
        <Route path="/project" element={<Navigate to="/" replace />} />
        <Route path="/project/" element={<Navigate to="/" replace />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  )
}

export default App