import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────
// Step 3：State 是「快照」—— setState 不是赋值，是排队
//
// 一次性搞懂三个概念：
//   1. setState 不立即改值 → 同一轮 render 里 state 冻结不变
//   2. Batching → 多个 setState 合并成一次 render
//   3. 函数式更新 → 打破闭包陷阱的正确方式
// ─────────────────────────────────────────────────────────────────

let renderSeq = 0

export function Step3() {
  const [n, setN] = useState(0)
  const [m, setM] = useState(0)
  const [log, setLog] = useState<string[]>([])

  const r = ++renderSeq
  const push = (msg: string) => setLog(l => [...l, `[render#${r}] ${msg}`])

  console.log(`🔄 render#${r} | n=${n}  m=${m}`)

  // ── 场景 1：闭包陷阱 — setN(n+1) 连调 3 次 ✅ 只 +1
  const staleClosure = () => {
    setLog([])
    push('──── setN(n+1) ×3 ────')
    push(`调用前 n=${n}`)
    setN(n + 1) // 这里读到的 n 是"这次 render 的快照值"
    setN(n + 1) // 还是同一个 n，没变
    setN(n + 1) // 还是同一个 n
    push(`三次 setN 之后，同步读 n 仍然是 ${n}（没变！setState 不立即改值）`)
  }

  // ── 场景 2：函数式更新 — prev => prev+1 连调 3 次 ✅ +3
  const functional = () => {
    setLog([])
    push('──── setN(prev=>prev+1) ×3 ────')
    setN(prev => prev + 1) // prev = 队列中的最新值
    setN(prev => prev + 1) // prev 已 +1
    setN(prev => prev + 1) // 累加
    push(`三个函数式更新入队，React 依次执行，最终 +3，n = ${n}`)
  }

  // ── 场景 3：batching — 两个 state 各 set 一次 → 只 1 次 render
  const batching = () => {
    setLog([])
    push('──── setN + setM ────')
    setN(n + 1)
    setM(m + 1)
    push('两个 setState 在同一次事件处理器里 → React 合并成 1 次 render')
  }

  // ── 场景 4：React 18 自动 batching — setTimeout 里也合并
  const asyncBatch = () => {
    // 所有 setState 都放在 setTimeout 里 → 全在同一个异步回调 → batch 成 1 次 render
    setTimeout(() => {
      setLog([])
      push('──── setTimeout 里 setN + setM ────')
      setN(prev => prev + 1)
      setM(prev => prev + 1)
      push('两个 setState 在 setTimeout 里 → React 18 合并成 1 次 render')
    }, 0)
  }

  // ── 场景 5：force re-render — 不改变任何 state，只触发 render
  const [, force] = useState(0)
  const forceRender = () => {
    push('──── force re-render（state 不变）────')
    force(x => x + 1)
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Step 3：State 是快照</h3>
      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
        setState 不立即改值，它只是把更新排队。同一轮 render 里 state 冻结。
      </p>

      {/* 状态面板 */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 16,
          padding: 12,
          background: '#f1f5f9',
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        <span>n = <strong>{n}</strong></span>
        <span>m = <strong>{m}</strong></span>
        <span>renderSeq = <strong>{renderSeq}</strong></span>
      </div>

      {/* 按钮 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={staleClosure} style={btnStyle}>
          闭包陷阱：setN(n+1) ×3
        </button>
        <button onClick={functional} style={{ ...btnStyle, background: '#dcfce7' }}>
          正确姿势：setN(prev{'=>'}prev+1) ×3
        </button>
        <button onClick={batching} style={btnStyle}>
          Batching：setN + setM
        </button>
        <button onClick={asyncBatch} style={btnStyle}>
          React 18：异步回调也 batch
        </button>
        <button onClick={forceRender} style={btnStyle}>
          force re-render
        </button>
        <button onClick={() => { setN(0); setM(0); setLog([]) }} style={{ ...btnStyle, background: '#fee2e2' }}>
          reset
        </button>
      </div>

      {/* 日志 */}
      <pre
        style={{
          background: '#1e293b',
          color: '#e2e8f0',
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          maxHeight: 260,
          overflow: 'auto',
          margin: '0 0 16px',
          lineHeight: 1.6,
        }}
      >
        {log.join('\n') || '（点按钮看 log）'}
      </pre>

      {/* 说明 */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ fontSize: 14 }}>核心结论：</strong>
        <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
          <li>
            <b>setState 是"排队"不是"赋值"。</b>{' '}
            调用 <code>setN(1)</code> 后立刻读 <code>n</code>，读到的是旧值。
            React 在当前事件处理函数跑完后才 flush 队列。
          </li>
          <li>
            <b>Batching = 多次 setState → 一次 render。</b>{' '}
            同一事件循环里的 setState 会被 React 合并。
            React 18 起，在任何地方（事件、setTimeout、Promise）都自动合并。
            看 renderSeq：点 "setN+setM" 只跳 1 格，点 "异步回调" 也只跳 1 格。
          </li>
          <li>
            <b>需要基于最新值更新？用函数式更新。</b>{' '}
            <code>setN(n+1)</code> 读的是闭包里的快照值；{' '}
            <code>setN(prev {'=>'} prev+1)</code> 读的是队列里的最新值。
          </li>
          <li>
            <b>「快照」的心智模型：</b>把每次 render 想象成一张照片。在这张照片里，所有 state 值都是固定的。
            你在 onClick 里读到的 n，就是「触发这次 render 之前」那一刻的值。
          </li>
        </ol>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: '#fff',
  fontSize: 13,
  cursor: 'pointer',
}
