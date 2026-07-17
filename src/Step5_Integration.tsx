import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────
// Step 5：综合练习 — 一个「搜索 + 列表」把前四步全部串起来
//
// 这个 mini 场景会让你看到：
//   - UI = f(state)：搜索词是 state，列表是 state → UI 自动追随
//   - Render 是纯函数：你用 filter 算展示列表，不在 render 里改外部变量
//   - useEffect 时机：发"请求"在 effect 里，cleanup 取消上一次
//   - 函数式更新：添加条目时用 prev => [...]，不依赖闭包快照
//   - StrictMode 影响：开发环境下 effect 会 setup→cleanup→setup
//
// 打开 Console，每步操作都有日志，看完整的 render → effect 流程。
// ─────────────────────────────────────────────────────────────────

const allItems = [
  'React 入门',
  'useState 用法',
  'useEffect 时机',
  'useLayoutEffect vs useEffect',
  'Render 纯函数',
  'State 快照',
  'Batching 批处理',
  'StrictMode 双调用',
  '函数式更新',
  '闭包陷阱',
  'Cleanup 函数',
  'React 18 自动批处理',
]

export function Step5() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [requestLog, setRequestLog] = useState<string[]>([])
  const renderSeqRef = useRef(0)
  const effectCallRef = useRef(0)

  renderSeqRef.current++
  const r = renderSeqRef.current

  const filtered = allItems.filter(item =>
    item.toLowerCase().includes(query.toLowerCase())
  )

  console.log(`🔄 render#${r} | query="${query}" | results.length=${results.length} | loading=${loading}`)

  // ── 模拟搜索请求 ──
  // 每次 query 变化 → 发起一次"请求"，上一次请求的 cleanup 会取消它
  useEffect(() => {
    // 空查询 → 不请求
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    effectCallRef.current++
    const callId = effectCallRef.current
    let cancelled = false

    setLoading(true)
    const startTime = performance.now().toFixed(0)

    setRequestLog(l => [
      ...l,
      `[${startTime}ms] 🔵 effect#${callId} setup — 发起搜索 "${query}"（300ms 后到）`,
    ])

    // 模拟网络延迟
    const timer = setTimeout(() => {
      if (cancelled) {
        setRequestLog(l => [
          ...l,
          `[${performance.now().toFixed(0)}ms] ⚠️ effect#${callId} 收到结果但已取消，丢弃`,
        ])
        return
      }

      const filtered = allItems.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setLoading(false)
      setRequestLog(l => [
        ...l,
        `[${performance.now().toFixed(0)}ms] ✅ effect#${callId} 收到结果，${filtered.length} 条匹配`,
      ])
    }, 300)

    // cleanup：取消上一次请求
    return () => {
      clearTimeout(timer)
      cancelled = true
      setRequestLog(l => [
        ...l,
        `🔴 effect#${callId} cleanup — 取消 "${query}" 的请求`,
      ])
    }
  }, [query])

  // ── 添加自定义条目（函数式更新演示）──
  const addItem = () => {
    const newItem = `自定义条目 ${allItems.length + 1}`
    // 注意：这里我们不能直接 push 到 allItems（它在模块作用域，不是 state）
    // 我们用函数式更新加一个新条目
    setResults(prev => [...prev, newItem])
    console.log(`  📝 函数式更新：setResults(prev => [...prev, "${newItem}"])`)
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Step 5：综合练习 — 搜索 + 列表</h3>
      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
        把四步的概念全部用在一个真实场景里。打开 Console，边操作边看日志。
      </p>

      {/* 搜索框 */}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="输入关键词搜索（试着手速快慢各来一次）"
        style={{
          padding: '10px 14px',
          border: '2px solid #3b82f6',
          borderRadius: 8,
          fontSize: 14,
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 12,
        }}
      />

      {/* 状态栏 */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 12, fontSize: 13, color: '#64748b' }}>
        <span>render# <strong>{r}</strong></span>
        <span>loading: <strong>{loading ? 'true' : 'false'}</strong></span>
        <span>匹配: <strong>{filtered.length}</strong> 条</span>
      </div>

      {/* 搜索结果 */}
      <div style={{ marginBottom: 16 }}>
        {loading && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>⏳ 搜索中…</div>}
        {!loading && query && filtered.length === 0 && (
          <div style={{ fontSize: 13, color: '#94a3b8' }}>无匹配结果</div>
        )}
        {filtered.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {filtered.map((item, i) => (
              <li
                key={i}
                style={{
                  padding: '6px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 13,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={addItem} style={btnStyle}>
          添加自定义条目（函数式更新）
        </button>
      </div>

      {/* request 日志 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Effect 请求日志：</div>
        <pre
          style={{
            background: '#1e293b',
            color: '#e2e8f0',
            padding: 12,
            borderRadius: 8,
            fontSize: 11,
            maxHeight: 200,
            overflow: 'auto',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {requestLog.join('\n') || '（输入搜索词观察 effect setup/cleanup）'}
        </pre>
      </div>

      {/* 说明 */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.8 }}>
        <strong>这个场景展示了什么：</strong>
        <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
          <li>
            <b>UI = f(state)（Step 1）：</b>{' '}
            query 和 results 是 state，filtered 是纯计算。
            query 变了 → render 重跑 → filtered 自动更新 → UI 自动更新。
          </li>
          <li>
            <b>render → effects 流水线（Step 2）：</b>{' '}
            Search 的副作用（"发请求"）放在 useEffect 里，
            在 render 和 commit 之后才执行。
          </li>
          <li>
            <b>State 快照 + 函数式更新（Step 3）：</b>{' '}
            添加条目用 <code>setResults(prev {'=>'} [...prev, item])</code>，
            不依赖 this.state 快照。
          </li>
          <li>
            <b>Cleanup 取消请求（Step 2 + 4）：</b>{' '}
            快速输入时，每次新 query 触发新 effect，旧 effect 的 cleanup
            取消上一个请求。这就是 <b>effect cleanup 的真正用途</b>。
          </li>
        </ol>
        <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 4 }}>
          <strong>动手试试：</strong>先慢慢输入"use"，看日志慢慢出现。再快速乱敲几个字，
          看 cleanup 如何在请求还没回来之前取消它。这就是 React 帮你处理的竞态问题。
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
