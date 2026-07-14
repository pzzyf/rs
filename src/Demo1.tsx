import { useState, useEffect, useLayoutEffect } from 'react'

// ─────────────────────────────────────────────────────────────────
// Demo 1：组件执行顺序与 Effect 时机
//
// 核心结论：
//   1. 初次挂载：父 render → 子 render → (commit DOM) → useLayoutEffect → 浏览器 paint → useEffect
//   2. useLayoutEffect 与 useEffect 是「两条独立队列」，都是「子→父」（叶子往根冒泡）
//   3. useLayoutEffect：commit 后同步执行，阻塞 paint
//   4. useEffect：paint 后异步执行，不阻塞 paint
//   5. 依赖数组为 []：只在挂载时执行一次 effect；cleanup 在卸载时执行
//   6. 依赖变化：先执行旧 effect 的 cleanup，再执行新 effect
// ─────────────────────────────────────────────────────────────────

const t = () => performance.now().toFixed(0)

function Child({ id }: { id: string }) {
  console.log(`[${t()}ms] 🟢 ${id} render 开始（函数体执行）`)

  useLayoutEffect(() => {
    console.log(`[${t()}ms] 🟪 ${id} useLayoutEffect（DOM 后、paint 前）`)
    return () => console.log(`[${t()}ms] 🟪 ${id} useLayoutEffect cleanup`)
  }, [])

  useEffect(() => {
    console.log(`[${t()}ms] 🟦 ${id} useEffect（paint 后异步）`)
    return () => console.log(`[${t()}ms] 🟥 ${id} useEffect cleanup`)
  }, [])

  console.log(`[${t()}ms] 🟢 ${id} render 返回 JSX`)
  return <div style={{ marginLeft: 20, borderLeft: '2px solid #bbb', paddingLeft: 8 }}>{id}</div>
}

export function Demo1() {
  const [show, setShow] = useState(true)
  const [n, setN] = useState(0)

  console.log(`\n===== [App render n=${n}] =====`)

  useLayoutEffect(() => {
    console.log(`[${t()}ms] 🟪 App useLayoutEffect`)
    return () => console.log(`[${t()}ms] 🟪 App useLayoutEffect cleanup`)
  }, [])

  useEffect(() => {
    console.log(`[${t()}ms] 🟦 App useEffect`)
    return () => console.log(`[${t()}ms] 🟥 App useEffect cleanup`)
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>Demo 1：组件执行顺序与 Effect 时机</h3>
      <p>n = <strong>{n}</strong>　（改变 n 会重新 render，但不会挂载/卸载 Child）</p>
      <button onClick={() => setN(n + 1)}>触发 re-render (n+1)</button>
      <button onClick={() => setShow(s => !s)} style={{ marginLeft: 8 }}>
        {show ? '卸载 Child' : '挂载 Child'}
      </button>

      <div style={{ marginTop: 12, border: '1px solid #ccc', padding: 8 }}>
        App
        {show && (
          <>
            <Child id="Child-A" />
            <Child id="Child-B" />
          </>
        )}
      </div>

      <pre style={{ background: '#f6f8fa', padding: 12, marginTop: 16, fontSize: 12 }}>
{`打开 Console 观察：

【初次挂载】会看到顺序：
  App render → Child-A render → Child-B render
  → Child-A useLayoutEffect → Child-B useLayoutEffect → App useLayoutEffect
  → Child-A useEffect → Child-B useEffect → App useEffect
  （Effect 从叶子往根冒泡，layoutEffect 永远早于 useEffect）

【点 n+1】（不挂载/卸载）：
  只会执行 render，不会再次执行 useEffect（因为依赖是 []）
  → 说明 「render」和「effect」是两回事，effect 受依赖控制

【卸载 Child】：
  先执行 Child 的 effect cleanup，再移除 DOM
  → cleanup 在卸载时执行`}
      </pre>
    </div>
  )
}