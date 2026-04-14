import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Play, GitCommit, MoveRight } from 'lucide-react'

function Demo() {
  const [commits, setCommits] = useState<{ id: string; branch: 'main' | 'dev' }[]>([
    { id: 'a1b2c3d', branch: 'main' }
  ])

  const addCommit = (branch: 'main' | 'dev') => {
    const newId = Math.random().toString(16).slice(2, 9)
    setCommits([...commits, { id: newId, branch }])
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Interactive Demo</h1>
        <p>Visualize how Git branching works in real-time. Create commits on main or dev branches.</p>
      </header>

      <div className="demo-area">
        <div className="branch-controls">
          <button onClick={() => addCommit('main')} className="demo-btn main-btn">
            Commit to Main
          </button>
          <button onClick={() => addCommit('dev')} className="demo-btn dev-btn">
            Commit to Dev
          </button>
        </div>

        <div className="visual-timeline">
          {commits.map((commit, idx) => (
            <div key={commit.id} className={`commit-node ${commit.branch} ${idx === commits.length - 1 ? 'last' : ''}`}>
              <div className="node-circle">
                <GitCommit size={16} />
              </div>
              <span className="commit-id">{commit.id}</span>
              {idx < commits.length - 1 && <div className="connector"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="button-group">
        <Link to="/" className="nav-button secondary">
          <ArrowLeft size={18} />
          Back Home
        </Link>
      </div>
    </div>
  )
}

export default Demo
