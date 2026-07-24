import { useState } from 'react'
import { Step1 } from './Step1_UIisFunction'
import { Step2 } from './Step2_RenderCommit'
import { Step3 } from './Step3_Snapshot'
import { Step4 } from './Step4_Purity'
import { Step5 } from './Step5_Integration'
import { Demo } from './demo'

const steps = [
  { id: 1, title: 'UI = f(state)', C: Step1 },
  { id: 2, title: 'render → commit → effects', C: Step2 },
  { id: 3, title: 'State 是快照', C: Step3 },
  { id: 4, title: 'Render 纯度', C: Step4 },
  { id: 5, title: '综合练习', C: Step5 },
  { id: 6, title: 'Demo', C: Demo },
]

export default function App() {
  const [step, setStep] = useState(1)
  const Current = steps.find(s => s.id === step)!.C

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 860, margin: '0 auto', minHeight: '100vh' }}>
      <nav
        style={{
          display: 'flex',
          gap: 4,
          padding: '16px 16px 12px',
          borderBottom: '2px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 1,
          flexWrap: 'wrap',
        }}
      >
        {steps.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              background: step === s.id ? '#2563eb' : '#f1f5f9',
              color: step === s.id ? '#fff' : '#334155',
              fontWeight: step === s.id ? 600 : 400,
              transition: 'background 0.15s',
            }}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </nav>
      <Current />
    </div>
  )
}
