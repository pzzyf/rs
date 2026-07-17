import { useState, useEffect, useLayoutEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────
// Step 2：三步流水线
//
// state 变了之后，React 不是直接改 DOM 就完了。
// 它有一条固定的流水线：
//
//   ① render     → React 调用你的函数，算出新 JSX（纯计算，没碰 DOM）
//   ② commit     → React 把 JSX 写入真实 DOM（你不管）
//   ③ effects    → DOM 有了，可以安全做副作用了
//       ├─ useLayoutEffect：commit 后立刻同步执行，卡住 paint
//       └─ useEffect：paint 之后异步执行，不卡画面
//
// 一句话：render 先算，useLayoutEffect 卡在 paint 前，useEffect 在 paint 后。
// ─────────────────────────────────────────────────────────

// ── 子组件：展示 render 和 effect 的先后顺序 ──
function Child({ label }: { label: string }) {
  console.log(`  🟢 ${label} render`)

  useLayoutEffect(() => {
    console.log(`  🟣 ${label} useLayoutEffect`)
  })

  useEffect(() => {
    console.log(`  🔵 ${label} useEffect`)
  })

  return (
    <div style={{ marginLeft: 16, padding: '4px 8px', borderLeft: '3px solid #94a3b8', fontSize: 13 }}>
      {label}
    </div>
  )
}

// ── 闪烁演示 ──
// 思路：色块初始渲染在右边（translateX: 300px），effect 负责拉回左边。
//
// useLayoutEffect 版：paint 前拉回 → 眼睛看不到错误位置
// useEffect 版：    p aint 后延迟 600ms 才拉回 → 你能清晰看到"先右后左"的跳动
function ShiftBox({ mode }: { mode: 'layout' | 'effect' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pullBack, setPullBack] = useState(false)

  useLayoutEffect(() => {
    if (mode !== 'layout') return
    // 不用测越界了，直接拉回来。paint 前生效，你看不到旧位置。
    setPullBack(true)
    console.log('  ✅ useLayoutEffect：paint 前拉回，你眼睛看不到右边那个位置')
  })

  useEffect(() => {
    if (mode !== 'effect') return
    // 故意延迟 600ms，让你看清楚色块在右边待了一会再跳回来
    const timer = setTimeout(() => {
      setPullBack(true)
      console.log('  ⚠️ useEffect：600ms 后才拉回，你应该看到色块先在右边，再跳到左边')
    }, 600)
    return () => clearTimeout(timer)
  })

  return (
    <div
      ref={ref}
      style={{
        transform: pullBack ? 'translateX(0)' : 'translateX(300px)',
        background: mode === 'layout' ? '#bbf7d0' : '#fecaca',
        border: `3px solid ${mode === 'layout' ? '#16a34a' : '#dc2626'}`,
        borderRadius: 6,
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {pullBack ? '✅ 在左边了' : '⬅ 我在右边 300px'}
    </div>
  )
}

export function Step2() {
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState<'layout' | 'effect'>('layout')
  const [key, setKey] = useState(0)
  const showChild = count % 2 === 0

  // ── 父组件自身的日志 ──
  console.log(`🟢 Step2 render`)

  useLayoutEffect(() => {
    console.log(`🟣 Step2 useLayoutEffect`)
  })

  useEffect(() => {
    console.log(`🔵 Step2 useEffect`)
  })

  const switchMode = (m: 'layout' | 'effect') => {
    setMode(m)
    setKey(k => k + 1) // 换 key 强制重新挂载 ShiftBox
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Step 2：render → commit → effects 流水线</h3>
      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
        render 先执行（函数体），然后 DOM 写入，然后 useLayoutEffect（同步，卡 paint），最后 useEffect（异步，paint 后）。
      </p>

      {/* ── 时间线演示 ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          打开 Console 看执行顺序：
        </div>
        <button onClick={() => setCount(c => c + 1)} style={btnStyle}>
          +1（触发 re-render）count = {count}
        </button>
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 12 }}>
          每点一次，Console 里看 🟢→🟣→🔵 的固定顺序
        </span>

        {/* 子组件：演示 render/effect 的 父→子 关系 */}
        {showChild && (
          <div style={{ marginTop: 12, padding: 8, border: '1px dashed #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <div>Step2（父）</div>
            <Child label="Child" />
          </div>
        )}
        {!showChild && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
            （子组件已卸载，再点 +1 就挂回来）
          </div>
        )}
      </div>

      {/* ── 可视化闪烁演示 ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          可视化演示：为什么需要 useLayoutEffect？
        </div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
          这个色块初始渲染在屏幕右侧（translateX: 300px），effect 负责拉回左边。
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => switchMode('layout')}
            style={{ ...btnStyle, background: mode === 'layout' ? '#16a34a' : '#fff', color: mode === 'layout' ? '#fff' : '#334155' }}
          >
            useLayoutEffect（无闪烁）
          </button>
          <button
            onClick={() => switchMode('effect')}
            style={{ ...btnStyle, background: mode === 'effect' ? '#dc2626' : '#fff', color: mode === 'effect' ? '#fff' : '#334155' }}
          >
            useEffect（有闪烁）
          </button>
        </div>

        <div style={{ overflow: 'hidden', padding: '12px 0', minHeight: 40 }} key={key}>
          <ShiftBox mode={mode} />
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>
          {mode === 'layout'
            ? '✅ useLayoutEffect 在 paint 之前就拉回来了，你的眼睛直接看到最终位置。'
            : '⚠️ useEffect 延迟 600ms 才拉回来——先看到色块在右边，然后跳到左边。这就是闪烁。'}
        </div>
      </div>

      {/* ── 总结 ── */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.8 }}>
        <strong>三步流水线总结：</strong>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#dbeafe' }}>
              <th style={tdStyle}>阶段</th>
              <th style={tdStyle}>谁干的</th>
              <th style={tdStyle}>干什么</th>
              <th style={tdStyle}>特点</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>① render</td>
              <td style={tdStyle}>React 调用组件函数</td>
              <td style={tdStyle}>算新 JSX</td>
              <td style={tdStyle}>纯计算，不动 DOM，可中断</td>
            </tr>
            <tr style={{ background: '#f1f5f9' }}>
              <td style={tdStyle}>② commit</td>
              <td style={tdStyle}>React 内部</td>
              <td style={tdStyle}>JSX → 真实 DOM</td>
              <td style={tdStyle}>不可中断</td>
            </tr>
            <tr>
              <td style={tdStyle}>↳ LayoutEffect</td>
              <td style={tdStyle}>你的代码</td>
              <td style={tdStyle}>读/写 DOM、量尺寸</td>
              <td style={tdStyle}>同步，卡住 paint，子→父 冒泡</td>
            </tr>
            <tr style={{ background: '#f1f5f9' }}>
              <td style={tdStyle}>↳ paint</td>
              <td style={tdStyle}>浏览器</td>
              <td style={tdStyle}>画到屏幕</td>
              <td style={tdStyle}>用户终于看到画面</td>
            </tr>
            <tr>
              <td style={tdStyle}>③ Effect</td>
              <td style={tdStyle}>你的代码</td>
              <td style={tdStyle}>发请求、订阅、打日志</td>
              <td style={tdStyle}>异步，paint 之后，子→父 冒泡</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 8, color: '#64748b' }}>
          <strong>用哪个？</strong> 90% 用 useEffect。只有当你需要"读 DOM 尺寸 → 立刻改 DOM → 不能让用户看到旧值"（比如 tooltip 定位、防止布局抖动）时才用 useLayoutEffect。
        </div>
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

const tdStyle: React.CSSProperties = {
  border: '1px solid #bfdbfe',
  padding: '6px 10px',
  textAlign: 'left',
}
