import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ProjectDetail from './pages/ProjectDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/project/:slug" element={<ProjectDetail />} />
    </Routes>
  )
}

export default App