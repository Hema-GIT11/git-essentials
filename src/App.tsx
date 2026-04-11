import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Github, ArrowRight, Zap, Monitor } from 'lucide-react'
import Comparison from './Comparison'
import Commands from './Commands'

function Home() {
  return (
    <div className="container">
      <header className="header">
        <div className="icon-wrapper">
          <Github size={64} />
        </div>
        <h1>GitHub</h1>
        <p>A simple overview of your GitHub presence.</p>
      </header>
      
      <div className="button-group vertical">
        <Link to="/comparison" className="nav-button">
          <Monitor size={18} />
          CLI vs Desktop
          <ArrowRight size={18} className="ml-auto" />
        </Link>
        <Link to="/commands" className="nav-button">
          <Zap size={18} />
          Powerful Commands
          <ArrowRight size={18} className="ml-auto" />
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/commands" element={<Commands />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
