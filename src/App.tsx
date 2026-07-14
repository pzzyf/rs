import { useState } from 'react'
import { Demo1 } from './Demo1'
import { Demo2 } from './Demo2'
import { Demo3 } from './Demo3'

const demos = [
  { id: 1, title: '执行顺序 & Effect', C: Demo1 },
  { id: 2, title: 'render 纯度 & StrictMode', C: Demo2 },
  { id: 3, title: '状态更新 & batching', C: Demo3 },
]

export default function App() {
  const [active, setActive] = useState(1)
  const Current = demos.find(d => d.id === active)!.C
  return (
    <div style={{ fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #ddd' }}>
        {demos.map(d => (
          <button
            key={d.id}
            onClick={() => setActive(d.id)}
            style={{ fontWeight: active === d.id ? 'bold' : 'normal' }}
          >
            Demo {d.id}：{d.title}
          </button>
        ))}
      </div>
      <Current />
    </div>
  )
}