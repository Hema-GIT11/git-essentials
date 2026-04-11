import { Terminal, Monitor, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function Comparison() {
  return (
    <div className="container">
      <header className="header">
        <div className="icon-group">
          <div className="icon-wrapper smaller">
            <Terminal size={40} />
          </div>
          <span className="vs">VS</span>
          <div className="icon-wrapper smaller">
            <Monitor size={40} />
          </div>
        </div>
        <h1>Git CLI vs Desktop</h1>
        <p>Comparing the power of the terminal with the clarity of a GUI. Which one fits your workflow better?</p>
      </header>
      
      <div className="button-group">
        <Link to="/" className="nav-button secondary">
          <ArrowLeft size={18} />
          Back to GitHub
        </Link>
      </div>
    </div>
  )
}

export default Comparison
