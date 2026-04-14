import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Github, GitBranch, GitMerge, Terminal, Monitor, Database, Cloud,
  Lock, RefreshCcw, Layers, Code2, AlertCircle, Scissors, Bookmark, Plus, ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorKey = 'main' | 'feat' | 'merge' | 'squash' | 'ghost'
type ModeKey  = 'merge' | 'rebase' | 'squash' | 'branch'

// shape='label' → rounded-rect branch label box; default → circle commit node
interface GNode  { id: string; x: number; y: number; label: string; color: ColorKey; shape?: 'label' }
interface GEdge  { from: string; to: string; dashed?: boolean; color?: ColorKey }
interface Step   { desc: string; nodes: GNode[]; edges: GEdge[] }

// ─── Palette ──────────────────────────────────────────────────────────────────

const C: Record<ColorKey, { fill: string; stroke: string; text: string; glow: string }> = {
  main:   { fill: '#0e7490', stroke: '#22d3ee', text: '#e0f2fe', glow: '#22d3ee' },
  feat:   { fill: '#854d0e', stroke: '#fbbf24', text: '#fef9c3', glow: '#f59e0b' },
  merge:  { fill: '#065f46', stroke: '#34d399', text: '#d1fae5', glow: '#10b981' },
  squash: { fill: '#6b21a8', stroke: '#c084fc', text: '#f3e8ff', glow: '#a855f7' },
  ghost:  { fill: 'rgba(255,255,255,0.1)', stroke: '#e2e8f0', text: '#e2e8f0', glow: '#fff' },
}

const MODE_COLOR: Record<ModeKey, string> = {
  merge:  '#34d399',
  rebase: '#22d3ee',
  squash: '#c084fc',
  branch: '#fbbf24',
}

const MODE_CMD: Record<ModeKey, string> = {
  merge:  'git merge',
  rebase: 'git rebase',
  squash: 'git merge --squash',
  branch: 'git branch',
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
// Two-lane layout matching ByteByteGo style:
//   main branch :  y = 165  (bottom lane)
//   feature branch: y = 85  (top lane)

const MY = 380  // main lane y (shiftded further down)
const FY = 200  // feature lane y

const mn  = (id: string, label: string, x: number, color: ColorKey = 'main'):  GNode => ({ id, x, y: MY, label, color })
const fn_ = (id: string, label: string, x: number, color: ColorKey = 'feat'):  GNode => ({ id, x, y: FY, label, color })
const lbl = (id: string, label: string, x: number, y: number, color: ColorKey): GNode => ({ id, x, y, label, color, shape: 'label' })

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS: Record<ModeKey, Step[]> = {
  merge: [
    {
      desc: '① Initial state — main branch has two commits: C0 and C1.',
      nodes: [
        lbl('lmain', 'Main', 90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
      ],
    },
    {
      desc: '② git checkout -b feature from C1 — a new Feature branch is born.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        lbl('lfeat', 'Feature 1', 350, FY, 'feat'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'lfeat', to:'C1', dashed:true },   // label points down to branch point
      ],
    },
    {
      desc: '③ Three commits added on the feature branch: A → B → C.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
        fn_('B', 'B', 490),
        fn_('C', 'C', 600),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },               // diagonal branch arrow
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
      ],
    },
    {
      desc: '④ Meanwhile, two more commits land on main: D and E.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
        fn_('B', 'B', 490),
        fn_('C', 'C', 600),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
      ],
    },
    {
      desc: '⑤ git merge feature — merge commit M is created with two parents: E (main) and C (feature).',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        mn('M',  'M',  670, 'merge'),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
        fn_('B', 'B', 490),
        fn_('C', 'C', 600),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:'M' },
        { from:'C',     to:'M' },        // diagonal from feature to merge commit
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
      ],
    },
    {
      desc: '✅ Merge complete. Both branch histories preserved. The "V" shape shows exactly where feature diverged and rejoined.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        mn('M',  'M',  670, 'merge'),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
        fn_('B', 'B', 490),
        fn_('C', 'C', 600),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:'M' },
        { from:'C',     to:'M' },
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
      ],
    },
  ],

  rebase: [
    {
      desc: '① Initial state: Main branch has commits C0 to E. Feature branch (A, B, C) diverged at C1.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
        fn_('B', 'B', 490),
        fn_('C', 'C', 600),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
      ],
    },
    {
      desc: '② git rebase main — We start by moving the branch pointer. The original commits are "detached".',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lrebase', 'Git Rebase', 720, MY, 'squash'),
        lbl('lfeat', 'Feature 1', 230, FY, 'ghost'),
        fn_('A', 'A', 380, 'ghost'),
        fn_('B', 'B', 490, 'ghost'),
        fn_('C', 'C', 600, 'ghost'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'C1',    to:'A' }, // ghosted or removed, here kept as reference
      ],
    },
    {
      desc: "③ The first commit A is re-applied on top of E as A'. It gets a brand new SHA hash.",
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lrebase', 'Git Rebase', 720, MY, 'squash'),
        fn_("A'", "A'", 660, 'feat'),
        // ghosts
        fn_('A', 'A', 380, 'ghost'),
        fn_('B', 'B', 490, 'ghost'),
        fn_('C', 'C', 600, 'ghost'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:"A'", dashed:true },
      ],
    },
    {
      desc: "④ B and C are also replayed. The history is now perfectly linear.",
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lrebase', 'Git Rebase', 880, MY, 'squash'),
        fn_("A'", "A'", 660, 'feat'),
        fn_("B'", "B'", 760, 'feat'),
        fn_("C'", "C'", 860, 'feat'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:"A'" },
        { from:"A'",    to:"B'" },
        { from:"B'",    to:"C'" },
      ],
    },
    {
      desc: "✅ Rebase complete. Feature 1 label now points to the new tip. History is clean and straight.",
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lfeat', 'Feature 1', 980, FY, 'feat'),
        fn_("A'", "A'", 660, 'feat'),
        fn_("B'", "B'", 760, 'feat'),
        fn_("C'", "C'", 860, 'feat'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:"A'" },
        { from:"A'",    to:"B'" },
        { from:"B'",    to:"C'" },
        { from:'lfeat', to:"C'", dashed:true },
      ],
    },
  ],

  squash: [
    {
      desc: '① Main: C0 → C1. Feature branched from C1.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },
      ],
    },
    {
      desc: '② WIP commits pile up on feature: A ("fix typo") → B ("wip") → C ("ok FINAL").',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        lbl('lfeat', 'Feature 1', 230, FY, 'feat'),
        fn_('A', 'A', 380),
        fn_('B', 'B', 490),
        fn_('C', 'C', 600),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'lfeat', to:'A', dashed:true },
        { from:'C1',    to:'A' },
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
      ],
    },
    {
      desc: '③ git merge --squash: A+B+C diffs are combined into one staged change. Old A, B, C are abandoned.',
      nodes: [
        lbl('lmain', 'Main',      90,  MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        mn('S',  'S',  670, 'squash'),
        // ghost old
        lbl('lfeat', 'Feature 1', 230, FY, 'ghost'),
        fn_('A', 'A', 380, 'ghost'),
        fn_('B', 'B', 490, 'ghost'),
        fn_('C', 'C', 600, 'ghost'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:'S' },
        { from:'C1',    to:'A' },
        { from:'A',     to:'B' },
        { from:'B',     to:'C' },
        { from:'C',     to:'S', dashed:true },
      ],
    },
    {
      desc: '✅ Squash complete. One tidy commit S on main contains all changes from A+B+C. Clean history, single PR unit.',
      nodes: [
        lbl('lmain', 'Main', 90, MY, 'main'),
        mn('C0', 'C0', 230),
        mn('C1', 'C1', 350),
        mn('D',  'D',  460),
        mn('E',  'E',  570),
        mn('S',  'S',  670, 'squash'),
      ],
      edges: [
        { from:'lmain', to:'C0', dashed:true },
        { from:'C0',    to:'C1' },
        { from:'C1',    to:'D' },
        { from:'D',     to:'E' },
        { from:'E',     to:'S' },
      ],
    },
  ],
  branch: [
    {
      desc: '① Initial state: Main branch points to commit B. HEAD points to current branch (Main).',
      nodes: [
        mn('A', 'A', 150),
        mn('B', 'B', 425),
        lbl('lmain', 'main', 425,  MY - 75, 'main'),
        lbl('lhead', 'HEAD', 425,  MY - 170, 'ghost'),
      ],
      edges: [
        { from:'A',     to:'B' },
        { from:'lmain', to:'B', dashed:true },
        { from:'lhead', to:'lmain', dashed:true, color:'ghost' },
      ],
    },
    {
      desc: '② git branch feature-x — A new branch pointer is created, also pointing to B.',
      nodes: [
        mn('A', 'A', 150),
        mn('B', 'B', 425),
        lbl('lmain', 'main', 425,  MY - 75, 'main'),
        lbl('lfeat', 'feature-x', 425, FY - 75, 'feat'),
        lbl('lhead', 'HEAD', 425,  MY - 170, 'ghost'),
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'lmain', to: 'B', dashed: true },
        { from: 'lfeat', to: 'B', dashed: true },
        { from: 'lhead', to: 'lmain', dashed: true, color: 'ghost' },
      ],
    },
    {
      desc: '③ git checkout feature-x — HEAD moves to the new active branch.',
      nodes: [
        mn('A', 'A', 150),
        mn('B', 'B', 425),
        lbl('lmain', 'main', 425,  MY - 75, 'main'),
        lbl('lfeat', 'feature-x', 425, FY - 75, 'feat'),
        lbl('lhead', 'HEAD', 425,  FY - 170, 'ghost'),
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'lmain', to: 'B', dashed: true },
        { from: 'lfeat', to: 'B', dashed: true },
        { from: 'lhead', to: 'lfeat', dashed: true, color: 'ghost' },
      ],
    },
    {
      desc: '④ New commit C — feature-x pointer moves forward; main remains at B.',
      nodes: [
        mn('A', 'A', 150),
        mn('B', 'B', 425),
        mn('C', 'C', 700),
        lbl('lmain', 'main', 425,  MY - 75, 'main'),
        lbl('lfeat', 'feature-x', 700, FY - 75, 'feat'),
        lbl('lhead', 'HEAD', 700,  FY - 170, 'ghost'),
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'lmain', to: 'B', dashed: true },
        { from: 'lfeat', to: 'C', dashed: true },
        { from: 'lhead', to: 'lfeat', dashed: true, color: 'ghost' },
      ],
    },
    {
      desc: '⑤ git checkout main — HEAD switches back to the main branch.',
      nodes: [
        mn('A', 'A', 150),
        mn('B', 'B', 425),
        mn('C', 'C', 700),
        lbl('lmain', 'main', 425,  MY - 75, 'main'),
        lbl('lfeat', 'feature-x', 700, FY - 75, 'feat'),
        lbl('lhead', 'HEAD', 425,  MY - 170, 'ghost'),
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'lmain', to: 'B', dashed: true },
        { from: 'lfeat', to: 'C', dashed: true },
        { from: 'lhead', to: 'lmain', dashed: true, color: 'ghost' },
      ],
    },
  ],
}

// ─── Animated Git Graph ───────────────────────────────────────────────────────

const NODE_R    = 35   // circle radius
const LBL_W     = 100  // label box half-width for connection calc
const LBL_H     = 28   // label box half-height

// Get the connection point of a node (edge of circle or edge of label box)
function outPoint(n: GNode, toward: GNode): [number, number] {
  if (n.shape === 'label') {
    // Nearest edge of the label rectangle toward `toward`
    const dx = toward.x - n.x, dy = toward.y - n.y
    const ax = Math.abs(dx), ay = Math.abs(dy)
    // Exit from right/left/top/bottom depending on direction
    if (ax / LBL_W > ay / LBL_H) {
      return [n.x + Math.sign(dx) * LBL_W, n.y]
    } else {
      return [n.x, n.y + Math.sign(dy) * LBL_H]
    }
  }
  const dx = toward.x - n.x, dy = toward.y - n.y
  const len = Math.hypot(dx, dy) || 1
  return [n.x + (dx / len) * NODE_R, n.y + (dy / len) * NODE_R]
}

function inPoint(n: GNode, from: GNode): [number, number] {
  if (n.shape === 'label') {
    const dx = from.x - n.x, dy = from.y - n.y
    const ax = Math.abs(dx), ay = Math.abs(dy)
    if (ax / LBL_W > ay / LBL_H) {
      return [n.x + Math.sign(dx) * LBL_W, n.y]
    } else {
      return [n.x, n.y + Math.sign(dy) * LBL_H]
    }
  }
  const dx = from.x - n.x, dy = from.y - n.y
  const len = Math.hypot(dx, dy) || 1
  return [n.x - (dx / len) * (NODE_R + 3), n.y - (dy / len) * (NODE_R + 3)]
}

function makePath(a: GNode, b: GNode): string {
  const [x1, y1] = outPoint(a, b)
  const [x2, y2] = inPoint(b, a)
  // Slight curve for diagonal edges (branch off / merge back)
  if (a.y !== b.y && a.shape !== 'label') {
    const cx = (x1 + x2) / 2, cy = y1   // control point in source lane
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

function GitGraph({ step, allSteps, accentColor }: {
  step: number; allSteps: Step[]; accentColor: string
}) {
  const cur      = allSteps[step]
  const prev     = step > 0 ? allSteps[step - 1] : null
  const prevIds  = new Set(prev?.nodes.map(n => n.id) ?? [])
  const prevEIds = new Set(prev?.edges.map(e => `${e.from}>${e.to}`) ?? [])

  const nodeMap: Record<string, GNode> = Object.fromEntries(cur.nodes.map(n => [n.id, n]))

  // Determine scroll width needed
  const maxX = Math.max(...cur.nodes.map(n => n.x), 680)
  const vw = maxX + 60

  return (
    <svg width="100%" height="100%" viewBox={`0 0 850 550`}
      preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        {/* Arrow markers */}
        <marker id="ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M1 2L9 5L1 8" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round"/>
        </marker>
        <marker id="aa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M1 2L9 5L1 8" fill="none" stroke={accentColor} strokeWidth="2" strokeLinejoin="round"/>
        </marker>
        {/* Glow filters */}
        {Object.entries(C).map(([k, col]) => (
          <filter key={k} id={`g${k}`}>
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feFlood floodColor={col.glow} floodOpacity="0.7" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="cb"/>
            <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        ))}
      </defs>

      {/* Lane guide lines */}
      <line x1="0" y1={MY} x2={vw} y2={MY} stroke="rgba(34,211,238,0.06)" strokeWidth="26" strokeLinecap="round"/>
      <line x1="0" y1={FY} x2={vw} y2={FY} stroke="rgba(251,191,36,0.05)" strokeWidth="26" strokeLinecap="round"/>

      {/* ── Edges ── */}
      <AnimatePresence>
        {cur.edges.map(e => {
          const a = nodeMap[e.from], b = nodeMap[e.to]
          if (!a || !b) return null
          const isNew = !prevEIds.has(`${e.from}>${e.to}`)
          const d = makePath(a, b)
          const edgeColor = e.color ? C[e.color].stroke : (isNew ? accentColor : 'rgba(255,255,255,0.18)')
          return (
            <motion.path
              key={`${step}-${e.from}-${e.to}`}
              d={d} fill="none"
              stroke={edgeColor}
              strokeWidth={isNew ? 2.2 : 1.8}
              strokeDasharray={e.dashed ? '8 5' : 'none'}
              markerEnd={isNew ? 'url(#aa)' : 'url(#ag)'}
              initial={isNew ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: isNew ? 0.05 : 0 }}
            />
          )
        })}
      </AnimatePresence>

      {/* ── Nodes ── */}
      <AnimatePresence>
        {cur.nodes.map(n => {
          const col    = C[n.color]
          const isNew  = !prevIds.has(n.id)
          const ghost  = n.color === 'ghost'

          if (n.shape === 'label') {
            return (
              <motion.g key={`${step}-${n.id}`}
                initial={isNew ? { opacity: 0, scale: 0.7 } : { opacity: ghost ? 0.25 : 1, scale: 1 }}
                animate={{ opacity: ghost ? 0.25 : 1, scale: 1 }}
                transition={isNew ? { type: 'spring', stiffness: 320, damping: 20 } : { duration: 0.3 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
                <rect
                  x={n.x - LBL_W} y={n.y - LBL_H}
                  width={LBL_W * 2} height={LBL_H * 2} rx={8}
                  fill={col.fill + '33'} stroke={col.stroke}
                  strokeWidth="1.8" strokeDasharray="5 3"
                />
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="16" fontWeight="800" fill={col.text}
                  fontFamily="'Inter', sans-serif">{n.label}</text>
              </motion.g>
            )
          }

          return (
            <motion.g key={`${step}-${n.id}`}
              initial={isNew ? { opacity: 0, scale: 0 } : { opacity: ghost ? 0.2 : 1, scale: 1 }}
              animate={{ opacity: ghost ? 0.2 : 1, scale: 1 }}
              transition={isNew
                ? { type: 'spring', stiffness: 420, damping: 18, delay: 0.2 }
                : { duration: 0.35 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
              {/* Glow ring on new non-ghost nodes */}
              {isNew && !ghost && (
                <motion.circle cx={n.x} cy={n.y} r={NODE_R + 6}
                  stroke={col.glow} strokeWidth="1.5" fill="none"
                  initial={{ opacity: 0.9, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                />
              )}
              <circle cx={n.x} cy={n.y} r={NODE_R}
                fill={col.fill} stroke={col.stroke} strokeWidth="2.5"
                filter={isNew && !ghost ? `url(#g${n.color})` : undefined}
              />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                fontSize={n.label.length > 2 ? 14 : 20}
                fontWeight="900" fill={col.text}
                fontFamily="'JetBrains Mono', monospace">
                {n.label}
              </text>
            </motion.g>
          )
        })}
      </AnimatePresence>
    </svg>
  )
}

// ─── GitModeSlide ─────────────────────────────────────────────────────────────

function GitModeSlide({ mode, minimal }: { mode: ModeKey, minimal?: boolean }) {
  const [step, setStep] = useState(0)
  const steps = STEPS[mode]
  const mc    = MODE_COLOR[mode]

  const next = () => step < steps.length - 1 && setStep(s => s + 1)
  const prev = () => step > 0 && setStep(s => s - 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%' }}>
      {/* Header - Hidden if minimal */}
      {!minimal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92rem', fontWeight: 700,
            color: mc, background: mc + '18', border: `1px solid ${mc}55`,
            padding: '0.3rem 0.85rem', borderRadius: '8px',
          }}>{MODE_CMD[mode]}</span>
          <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto', alignItems: 'center' }}>
            {steps.map((_: Step, i: number) => (
              <motion.div key={i} onClick={() => setStep(i)}
                animate={{ width: i === step ? 28 : 8, background: i === step ? mc : i < step ? mc + '55' : 'rgba(255,255,255,0.12)' }}
                transition={{ duration: 0.25 }}
                style={{ height: 8, borderRadius: 4, cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <AnimatePresence mode="wait">
        <motion.div key={`d${step}`}
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}
          style={{
            background: 'rgba(255,255,255,0.04)', border: minimal ? 'none' : `1px solid ${mc}28`,
            borderRadius: '12px', padding: '1rem 1.5rem',
            fontSize: '1.05rem', color: 'var(--text-secondary)',
            lineHeight: '1.65', flexShrink: 0,
            textAlign: minimal ? 'center' : 'left'
          }}>
          {steps[step].desc}
        </motion.div>
      </AnimatePresence>

      {/* Graph */}
      <div style={{
        flex: 1, minHeight: 0,
        background: minimal ? 'transparent' : 'radial-gradient(ellipse at 40% 60%, rgba(34,211,238,0.03) 0%, rgba(0,0,0,0.2) 75%)',
        border: minimal ? 'none' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', overflow: 'hidden', padding: '1rem',
      }}>
        <GitGraph step={step} allSteps={steps} accentColor={mc} />
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, padding: '0 2rem 1.5rem' }}>
        <button onClick={prev} disabled={step === 0} style={{
          padding: '0.3rem 0.85rem', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
          color: step === 0 ? 'rgba(255,255,255,0.15)' : 'var(--text-secondary)',
          cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
        }}>← Back</button>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%', background: mc, borderRadius: 2 }}
          />
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
          {step + 1}/{steps.length}
        </span>
        <button onClick={next} disabled={step === steps.length - 1} style={{
          padding: '0.3rem 0.85rem', borderRadius: '8px', border: '1px solid',
          borderColor: step === steps.length - 1 ? 'rgba(255,255,255,0.1)' : mc,
          background: step === steps.length - 1 ? 'transparent' : mc + '22',
          color: step === steps.length - 1 ? 'rgba(255,255,255,0.15)' : mc,
          cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
        }}>Next →</button>
      </div>
    </div>
  )
}

// ─── Slides ───────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 1, type: 'title',
    title: 'Git & GitHub – Essentials',
    subtitle: 'Version Control, Collaboration & Real-world Workflow',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    context: 'Seminar / Demo Presentation',
    badge: '', content: null,
  },
  {
    id: 2, type: 'content', badge: 'Basics', title: 'What is Git?',
    content: (
      <div className="grid-2">
        <ul className="feature-list">
          <li className="feature-item"><div className="dot"></div>Git is a <strong>Version Control System</strong> (VCS)</li>
          <li className="feature-item"><div className="dot"></div>Tracks every change in files over time</li>
          <li className="feature-item"><div className="dot"></div>Each commit has a unique <strong>SHA</strong> (Secure Hash)</li>
          <li className="feature-item"><div className="dot"></div>Works for code, docs, and any file type</li>
        </ul>
        <div className="card">
          <div className="badge">Real-world Example</div>
          <p style={{ marginBottom: '0.6rem', fontSize: '1rem', fontWeight: 600 }}>File: Commands.tsx</p>
          <div className="code-block" style={{ fontSize: '0.95rem' }}>
            <div>v1 → Initial commit ("add base")</div>
            <div>v2 → UI fix ("fix ui")</div>
            <div style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.85rem' }}>Each commit has unique SHA</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3, type: 'content', badge: 'Comparison', title: 'Git vs GitHub',
    content: (
      <div className="grid-vs">
        <div className="card">
          <div className="card-icon"><Database /></div>
          <h3>Git (The Engine)</h3>
          <p>Local tool that manages history on your machine. No internet needed for core tasks.</p>
        </div>
        <div className="vs-divider"><div className="vs-circle">VS</div></div>
        <div className="card">
          <div className="card-icon" style={{ color: 'var(--accent-purple)', background: 'rgba(188,140,255,0.1)' }}><Cloud /></div>
          <h3>GitHub (The Hub)</h3>
          <p>Cloud platform that stores repositories and enables team collaboration via PRs.</p>
        </div>
      </div>
    ),
  },
  {
    id: 3.5, type: 'strategy-overview', badge: 'Workflow Essentials',
    title: 'Syncing Workflows',
    subtitle: 'Managing your local changes and syncing with the remote team.',
    content: null, // Rendered by the strategy-overview logic
  },
  {
    id: 4, type: 'content', badge: 'Workflow', title: 'Commit vs Push',
    content: (
      <div className="grid-2">
        <div className="card">
          <div className="badge" style={{ background: 'rgba(63,185,80,0.15)', color: 'var(--accent-green)' }}>What is Commit?</div>
          <ul className="feature-list" style={{ gap: '0.85rem', fontSize: '1.15rem' }}>
            <li className="feature-item">Saving changes locally in Git</li>
            <li className="feature-item">Creates a project snapshot</li>
            <li className="feature-item">Unique SHA ID for each</li>
            <li className="feature-item">Works completely offline</li>
            <li className="feature-item">Tracks history and changes</li>
          </ul>
          <div className="code-block" style={{ marginTop: '1.5rem', borderColor: 'var(--accent-green)44' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>👉 Commit = Save changes locally</span>
          </div>
        </div>
        <div className="card">
          <div className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-blue)' }}>What is Push?</div>
          <ul className="feature-list" style={{ gap: '0.85rem', fontSize: '1.15rem' }}>
            <li className="feature-item">Sends commits to remote repository</li>
            <li className="feature-item">Uploads code to GitHub/Cloud</li>
            <li className="feature-item">Requires internet connection</li>
            <li className="feature-item">Makes changes visible to others</li>
          </ul>
          <div className="code-block" style={{ marginTop: '1.5rem', borderColor: 'var(--accent-blue)44' }}>
            <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>👉 Push = Upload commits to remote</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4.5, type: 'content', badge: 'Workflow', title: 'Fetch vs Pull',
    content: (
      <div className="grid-2">
        <div className="card">
          <div className="badge" style={{ background: 'rgba(255,171,112,0.15)', color: 'var(--accent-orange)' }}>What is Fetch?</div>
          <ul className="feature-list" style={{ gap: '0.85rem', fontSize: '1.15rem' }}>
            <li className="feature-item">Downloads remote changes only</li>
            <li className="feature-item">Does NOT change local files</li>
            <li className="feature-item">Updates Git's internal tracking</li>
            <li className="feature-item">Safe to use anytime</li>
          </ul>
          <div className="code-block" style={{ marginTop: '1.5rem', borderColor: 'var(--accent-orange)44' }}>
            <span style={{ color: 'var(--accent-orange)', fontWeight: 800 }}>👉 Fetch = Check/download without applying</span>
          </div>
        </div>
        <div className="card">
          <div className="badge" style={{ background: 'rgba(188,140,255,0.15)', color: 'var(--accent-purple)' }}>What is Pull?</div>
          <ul className="feature-list" style={{ gap: '0.85rem', fontSize: '1.15rem' }}>
            <li className="feature-item">Downloads AND merges changes</li>
            <li className="feature-item">Updates working files automatically</li>
            <li className="feature-item">Combines: <strong>fetch + merge</strong></li>
            <li className="feature-item">May cause merge conflicts</li>
          </ul>
          <div className="code-block" style={{ marginTop: '1.5rem', borderColor: 'var(--accent-purple)44' }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 800 }}>👉 Pull = Download and apply updates</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5, type: 'content', badge: 'Collaboration', title: 'Branch',
    content: (
      <div className="grid-2">
        <div className="card">
          <div className="badge">Definition</div>
          <ul className="feature-list">
            <li className="feature-item">An independent line of development.</li>
            <li className="feature-item">A lightweight pointer to a specific commit.</li>
            <li className="feature-item">Allows parallel work by multiple developers.</li>
            <li className="feature-item">Keeps the <strong>Main</strong> branch stable and production-ready.</li>
          </ul>
        </div>
        <div className="card" style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'var(--accent-blue)44' }}>
          <div className="badge" style={{ color: 'var(--accent-blue)' }}>Why use Branches?</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Isolate your work for:</p>
          <ul className="feature-list" style={{ gap: '0.65rem' }}>
            <li className="feature-item" style={{ fontSize: '1.1rem' }}>✨ New Features</li>
            <li className="feature-item" style={{ fontSize: '1.1rem' }}>🐛 Bug Fixes</li>
            <li className="feature-item" style={{ fontSize: '1.1rem' }}>🔬 Experimental changes</li>
          </ul>
          <div className="code-block" style={{ marginTop: 'auto', fontSize: '0.85rem' }}>
            “Work on your own copy, merge when ready.”
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5.2, type: 'full-visual', badge: 'Visual Guide', title: 'Branching Mechanics',
    content: <GitModeSlide mode="branch" minimal={true} />,
  },
  {
    id: 5.5, type: 'strategy-overview', badge: 'Advanced Syncing',
    title: 'Merge vs Rebase vs Squash',
    subtitle: 'Three ways to integrate changes — each with different trade-offs on history.',
    content: null,
  },
  {
    id: 6, type: 'full-visual', badge: 'Advanced Git', title: 'Merge',
    content: <GitModeSlide mode="merge" minimal={true} />,
  },
  {
    id: 7, type: 'full-visual', badge: 'Advanced Git', title: 'Rebase',
    content: <GitModeSlide mode="rebase" minimal={true} />,
  },
  {
    id: 8, type: 'full-visual', badge: 'Advanced Git', title: 'Squash',
    content: <GitModeSlide mode="squash" minimal={true} />,
  },
  {
    id: 9, type: 'content', badge: 'Reference', title: 'Essential Commit Actions',
    content: (
      <div className="actions-grid">
        {[
          { label: 'Checkout', icon: Terminal, cmd: 'git checkout <commit/branch>', desc: 'Switch to specific commit or branch' },
          { label: 'Revert', icon: RefreshCcw, cmd: 'git revert <commit>', desc: 'Create new commit that undoes changes' },
          { label: 'Reset', icon: AlertCircle, cmd: 'git reset --hard <commit>', desc: 'Move branch pointer back (delete history)' },
          { label: 'Reorder', icon: Layers, cmd: 'git rebase -i HEAD~n', desc: 'Change order of commits interactively' },
          { label: 'Undo', icon: RefreshCcw, cmd: 'git commit --amend', desc: 'Modify/Undo last commit message or changes', flipX: true },
          { label: 'Amend', icon: Plus, cmd: 'git commit --amend', desc: 'Update last commit with new changes' },
          { label: 'New Branch', icon: GitBranch, cmd: 'git checkout -b <name>', desc: 'Create and switch to new branch' },
          { label: 'Cherry-pick', icon: Scissors, cmd: 'git cherry-pick <commit>', desc: 'Apply specific commit to current branch' },
          { label: 'Create Tag', icon: Bookmark, cmd: 'git tag <tag-name>', desc: 'Mark specific commit as version/release' },
        ].map((act, i) => (
          <div key={i} className="action-card tooltip-trigger">
            <act.icon className="icon-small" size={18} style={act.flipX ? { transform: 'scaleX(-1)' } : {}} />
            <span>{act.label}</span>
            <div className="custom-tooltip">
              <div className="tooltip-cmd">{act.cmd}</div>
              <div className="tooltip-desc">{act.desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 10, type: 'content', badge: 'Tools', title: 'CLI vs GitHub Desktop',
    content: (
      <div className="grid-2">
        <div className="card">
          <div className="card-icon"><Terminal /></div>
          <h3>Git CLI</h3>
          <p>The Power User choice. Fast, flexible, and essential for advanced workflows.</p>
        </div>
        <div className="card">
          <div className="card-icon" style={{ color: 'var(--accent-blue)' }}><Monitor /></div>
          <h3>Desktop GUI</h3>
          <p>The Visual choice. Great for beginners to see changes and manage commits.</p>
        </div>
      </div>
    ),
  },
  {
    id: 11, type: 'content', badge: 'Advanced', title: 'Desktop Limitations',
    content: (
      <div className="grid-2">
        <div className="card">
          <ul className="feature-list">
            <li className="feature-item" style={{ color: 'var(--accent-red)' }}><Lock size={18} />&nbsp;No Interactive Rebase</li>
            <li className="feature-item" style={{ color: 'var(--accent-red)' }}><Lock size={18} />&nbsp;Complex Conflict Resolving</li>
            <li className="feature-item" style={{ color: 'var(--accent-red)' }}><Lock size={18} />&nbsp;Detailed History Editing</li>
          </ul>
        </div>
        <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--text-secondary)' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>The Conclusion</h4>
          <p>GUI is great for the 90%, but <strong>CLI is non-negotiable</strong> for the difficult 10% of workflows.</p>
        </div>
      </div>
    ),
  },
  {
    id: 11.5, type: 'content', badge: 'Power User', title: 'Stash: GUI vs CLI',
    content: (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
          GitHub Desktop supports basic stashing, but for <strong>surgical operations</strong>, the CLI is essential.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', flex: 1 }}>
          {[
            { t: 'Visibility', d: 'Only shows generic "Stashed changes" entry.', c: 'git stash show -p stash@{0}' },
            { t: 'Selective Stash', d: 'Cannot stash specific files only.', c: 'git stash push -- demo.txt' },
            { t: 'Multiple Entries', d: 'Difficult to track & label multiple stashes.', c: 'git stash list' },
            { t: 'Partial Restore', d: 'No file-level restore (must restore all).', c: 'git checkout stash@{0} -- demo.txt' },
            { t: 'Advanced Ops', d: 'No drop, specific apply, or branch creation.', c: 'git stash branch <name> stash@{0}' }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
              <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{idx+1}. {item.t}</h4>
              <p style={{ marginBottom: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Desktop: {item.d}</p>
              <div className="code-block" style={{ marginTop: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>CLI: </span> {item.c}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 11.6, type: 'content', badge: 'Power User', title: 'Advanced Log Analysis',
    content: (
      <div className="grid-2">
        <div className="card">
          <div className="badge" style={{ color: 'var(--accent-red)' }}>GUI Limitations</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--text-secondary)' }}>GitHub Desktop provides a simple list, but hides the power of:</p>
          <ul className="feature-list" style={{ gap: '0.8rem' }}>
            <li className="feature-item" style={{ fontSize: '1.05rem' }}>🔍 Complex Log Queries</li>
            <li className="feature-item" style={{ fontSize: '1.05rem' }}>👤 Author-based deep filtering</li>
            <li className="feature-item" style={{ fontSize: '1.05rem' }}>📑 RegEx Commit Searching</li>
          </ul>
        </div>
        <div className="card">
          <div className="badge">CLI Mastery</div>
          <p style={{ fontSize: '1.05rem', marginBottom: '1.2rem', color: 'var(--accent-blue)' }}>Surgical history mining:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="code-block" style={{ fontSize: '0.95rem' }}>
              <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '0.3rem' }}># Search commit messages</div>
              $ git log --grep="fix"
            </div>
            <div className="code-block" style={{ fontSize: '0.95rem' }}>
              <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '0.3rem' }}># Filter by specific author</div>
              $ git log --author="Name"
            </div>
            <div className="code-block" style={{ fontSize: '0.95rem', background: 'rgba(56, 189, 248, 0.04)' }}>
              <div style={{ opacity: 0.5, fontSize: '0.75rem', marginBottom: '0.3rem' }}># Combinable with formatting</div>
              $ git log --oneline --graph --author="Name"
            </div>
          </div>
        </div>
      </div>
    )
  },
]

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [cur, setCur] = useState(0)

  const next = () => cur < SLIDES.length - 1 && setCur(p => p + 1)
  const prev = () => cur > 0 && setCur(p => p - 1)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cur])

  const slide = SLIDES[cur]

  return (
    <div className="app-wrapper">
      {/* Background Decorative Elements */}
      <div className="bg-glow" />
      <div className="bg-grid" />
      
      <div className="presentation-container">
        <AnimatePresence mode="wait">
          <motion.div key={cur} 
            className={`slide ${slide.type === 'title' ? 'slide-cover' : ''} ${slide.type === 'full-visual' ? 'slide-full' : ''}`}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit   ={{ opacity: 0, scale: 0.98, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>

            {slide.type === 'title' ? (
              <div className="cover-split-layout">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="cover-left"
                >
                  <div className="cover-badge">ImagiNET SHIFT 2026</div>
                  <h1>{slide.title}</h1>
                  <p className="cover-subtitle">{slide.subtitle}</p>
                  <div className="cover-meta-single">
                    <span className="meta-label">Presented by </span>
                    <span className="meta-value"> Hemalatha</span>
                    <span className="meta-separator">•</span>
                    <span className="meta-value">{slide.date}</span>
                  </div>

                 
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, x: 40 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
                  className="cover-right"
                >
                  <div className="hero-visual-container">
                    <div className="hero-glow-orb" />
                    <div className="hero-glow-ring-1" />
                    <div className="hero-glow-ring-2" />
                    <Github size={240} strokeWidth={1} className="hero-github-icon" />
                    
                    {/* Floating Git branch icons */}
                    <motion.div className="float-icon fi-1" animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4 }}><GitBranch size={40} /></motion.div>
                    <motion.div className="float-icon fi-2" animate={{ y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}><GitMerge size={32} /></motion.div>
                    <motion.div className="float-icon fi-3" animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 6, delay: 1 }}><Database size={36} /></motion.div>
                  </div>
                </motion.div>
              </div>

            ) : slide.type === 'strategy-overview' ? (() => {
                const isSync = slide.id === 3.5;
                const items = isSync ? [
                  { id: 4,   color: '#34d399', label: 'Commit vs Push', Icon: Database,   cmd: 'local ↔ remote', desc: 'Managing local changes and publishing code.' },
                  { id: 4.5, color: '#22d3ee', label: 'Fetch vs Pull',  Icon: RefreshCcw, cmd: 'remote ↔ local', desc: 'Syncing your machine with team updates safely.' }
                ] : [
                  { id: 6, color: '#34d399', label: 'Merge',  Icon: GitMerge,  cmd: 'git merge',          desc: 'Preserve history. Safe for public branches.' },
                  { id: 7, color: '#22d3ee', label: 'Rebase', Icon: RefreshCcw, cmd: 'git rebase',         desc: 'Linear timeline. Rewrites history with new SHAs.' },
                  { id: 8, color: '#c084fc', label: 'Squash', Icon: Layers,     cmd: 'git merge --squash', desc: 'Condense WIP commits into one clean commit.' }
                ];
                return (
                  <>
                    <div className="slide-header">
                      <div className="badge">{slide.badge}</div>
                      <h2>{slide.title}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.4rem' }}>{slide.subtitle}</p>
                    </div>
                    <div className="slide-content">
                      <div className={isSync ? "grid-2" : "grid-3"}>
                        {items.map(({ id, color, label, Icon, cmd, desc }) => (
                          <div key={id} className="card"
                            onClick={() => setCur(SLIDES.findIndex(s => s.id === id))}
                            style={{ cursor: 'pointer', borderColor: color + '44', textAlign: 'center', height: '100%' }}>
                            <div className="card-icon" style={{ margin: '0 auto 0.85rem', color, background: color + '18' }}><Icon size={24} /></div>
                            <h3 style={{ color, fontSize: '1.4rem', fontWeight: 800 }}>{label}</h3>
                            <p style={{ fontSize: '0.95rem', margin: '0.6rem 0 1rem' }}>{desc}</p>
                            <div style={{ marginTop: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color, opacity: 0.8, padding: '0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>{cmd} →</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()
            : slide.type === 'full-visual' ? (
               <div className="slide-content" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>{slide.content}</div>
            ) : (
                <>
                  <div className="slide-header">
                    <div className="badge">{slide.badge}</div>
                    <h2>{slide.title}</h2>
                  </div>
                  <div className="slide-content">{slide.content}</div>
                </>
            )}

            {/* Global Slide Progress (Minimal) */}
            {slide.type !== 'title' && slide.type !== 'full-visual' && (
              <div className="global-progress">
                <div className="progress-track">
                  <motion.div 
                    className="progress-fill" 
                    animate={{ width: `${((cur + 1) / SLIDES.length) * 100}%` }}
                  />
                </div>
                <div className="progress-text">{cur + 1} / {SLIDES.length}</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {slide.type !== 'full-visual' && (
        <div className="site-footer">
          <span className="footer-brand"> From Basics to Real-World Workflow</span>
          <span className="footer-pipe">|</span>
          <span className="footer-title">{slide.title}</span>
        </div>
      )}
    </div>
  )
}

export default App
