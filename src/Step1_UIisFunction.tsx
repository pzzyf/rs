import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────
// Step 1：UI = f(state) — React 是所有前端框架里，心智模型最简单的：
// 你的组件是一个「函数」，state 是入参，JSX 是返回值。
// 每次 state 变化，React 就重跑一次这个函数 → 返回新的 JSX → 更新 DOM。
//
// 你现在看到的所有 React API（useEffect、useRef、memo …）都是
// 这个核心等式的「插件」——它们解决的是「纯函数算 UI」之外的问题。
// ─────────────────────────────────────────────────────────────────

let totalRenders = 0

export function Step1() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  totalRenders++
  const time = new Date().toLocaleTimeString()

  // 把这个 console.log 想象成"React 在执行你的函数"——
  // 每次点击按钮，你都会在这里看到一行新日志。
  console.log(
    `🔄 第 ${totalRenders} 次执行 Step1 函数体（render）｜ time=${time}｜ count=${count}｜ text="${text}"`
  )

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Step 1：UI = f(state)</h3>
      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
        组件就是一个函数。state 进去，UI 出来。改 state → 重跑函数 → 新 UI。
      </p>

      {/* ── 计数器 ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
          点击按钮 → <code>setCount</code> 被调用 → React 重新执行 Step1 函数体 → 新 UI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCount(c => c - 1)}
            style={btnStyle}
          >
            −
          </button>
          <span style={{ fontSize: 28, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>
            {count}
          </span>
          <button
            onClick={() => setCount(c => c + 1)}
            style={btnStyle}
          >
            +
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          值从哪里来？从 <code>useState(0)</code> 来。0 是初始值，只在第一次 render（挂载）时使用。
        </div>
      </div>

      {/* ── 文本输入 — 展示多个 state 独立工作 ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>
          输入文字（另一个独立的 state）：
        </label>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="每敲一个键都是一次 setState → 一次 re-render"
          style={{
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          你输入的是：「{text}」—— 注意每敲一个键，上面的 render 计数都在涨。
        </div>
      </div>

      {/* ── 关键结论 ── */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          关键结论（打开 Console 看日志）
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: '#334155' }}>
          <li>
            <strong>组件函数体 = render。</strong>
            React 不搞模板编译、不搞脏检查——它就是「重跑你的函数，拿新 JSX」。
          </li>
          <li>
            <strong>state 变了 → 函数重跑。</strong>
            点 +/− 或敲键盘，都是在触发 re-render。
            React 用新 state 重新调用 Step1 函数，用返回值更新 DOM。
          </li>
          <li>
            <strong>每一次 render 都是一次「快照」。</strong>
            在这一次函数执行里，<code>count</code> 和 <code>text</code> 的值是固定的。
            它们不会在你眼皮底下突然变化。
          </li>
          <li>
            <strong>多个 useState 互相独立。</strong>
            改 count 不影响 text，反之亦然。
          </li>
          <li>
            <strong>state 是局部的、隔离的。</strong>
            如果你渲染两个 Step1 组件，它们各自有自己的 count，互不干扰。
          </li>
        </ol>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#fff',
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
