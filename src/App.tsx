import { Github } from 'lucide-react'

function App() {
  return (
    <div className="container centered">
      <header className="header">
        <div className="icon-wrapper">
          <Github size={64} />
        </div>
        <h1>GitHub</h1>
        <p>A simple overview of your GitHub presence.</p>
      </header>
    </div>
  )
}

export default App
