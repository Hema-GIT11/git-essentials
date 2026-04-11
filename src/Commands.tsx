import { Code, ArrowLeft, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const COMMANDS = [
  { cmd: 'git commit --amend', desc: 'Fix your last commit' },
  { cmd: 'git rebase -i HEAD~3', desc: 'SQUASH your commits' },
  { cmd: 'git stash pop', desc: 'Bring back your stashed work' },
  { cmd: 'git cherry-pick <hash>', desc: 'Grab a specific commit' }
]

function Commands() {
  return (
    <div className="container">
      <header className="header">
        <div className="icon-wrapper smaller">
          <Zap size={40} className="accent-glow" />
        </div>
        <h1>Powerful Commands</h1>
        <p>Master the terminal with these essential Git secrets.</p>
        ui improvedd only for dev and main
      </header>

      <div className="command-list">
        {COMMANDS.map((item, idx) => (
          <div key={idx} className="command-card">
            <code>{item.cmd}</code>
            <span>{item.desc}</span>

            new changes added to dev
          </div>
        ))}
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

export default Commands
