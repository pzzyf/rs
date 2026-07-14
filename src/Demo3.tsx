import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────
// Demo 3：状态更新 & batching（批处理）
//
// 核心结论：
//   1. setState 不会立即改 state，而是「排队」一个更新。
//      本次事件处理函数跑完，React 才 flush 队列、真正重渲染。
//      → 所以同一事件里连续 setState 多次，中间读 state 拿到的还是「旧值」。
//
//   2. batching = 把多次 setState 合并成一次 render。
//      React 18 起「自动批处理」（automatic batching）：
//        - 事件处理器里 ✓ 合并
//        - setTimeout / Promise.then / fetch 回调里 ✓ 也合并（18 之前不合并！）
//      → 以前要手动 unstable_batchedUpdates，现在不用了。
//
//   3. 用「函数式更新」绕过 batching 里的 stale state：
//        setN(n + 1)   // 闭包捕获旧 n，连调 3 次只 +1
//        setN(prev => prev + 1)  // 基于「队列里最新的那个」再加1，连调3次 +3
//
//   4. flushSync 可以「强制立即 render」（极少用，慎用）
//
//   5. useState 的 initializer：只会在挂载时跑一次。
//      传函数 `useState(() => expensive())` 可以惰性初始化，避免每次 render 都算。
// ─────────────────────────────────────────────────────────────────

let renderSeq = 0

export function Demo3() {
  const [n, setN] = useState(0)
  const [m, setM] = useState(0)
  const [, force] = useState(0)
  const [log, setLog] = useState<string[]>([])

  const r = ++renderSeq
  const push = (s: string) => setLog(l => [...l, `[render#${r}] ${s}`])

  console.log(`[renderSeq#${r}] n=${n} m=${m}`)

  // ── 场景 1：同事件多次 setN(n+1) —— 同一个旧 n，合并成 1 次 render，但只 +1
  const badThree = () => {
    setLog(l => [...l, '──── 点了 badThree ────'])
    setN(n + 1) // n 取「这次事件开始时的值」，此时 n=旧值
    setN(n + 1) // 仍是同一个旧值
    setN(n + 1)
    push('读完同步代码，n 还是 ' + n + '（setState 没立即改）')
  }

  // ── 场景 2：函数式更新，每次基于「队列中最新值」加，3 次 → +3
  const goodThree = () => {
    setLog(l => [...l, '──── 点了 goodThree ────'])
    setN(prev => prev + 1)
    setN(prev => prev + 1)
    setN(prev => prev + 1)
    push('setN 三个函数式更新已入队')
  }

  // ── 场景 3：多 state 在同事件里各 set 一次 → 合并成 1 次 render（batching）
  const bothState = () => {
    setLog(l => [...l, '──── 点了 bothState（看只 render 一次）────'])
    setN(n + 1)
    setM(m + 1)
    push('setN/setM 全入队，看看下面 renderSeq 跳几格')
  }

  // ── 场景 4：异步回调里的 batching（React 18 新能力）
  const asyncBatch = async () => {
    setLog(l => [...l, '──── 点了 asyncBatch ────'])
    await Promise.resolve()
    setN(n + 1)
    setM(m + 1)
    push('在 microtask 里 setN/setM，看 renderSeq 是否只跳 1 格')
  }

  // ── 场景 5：flushSync 强制同步 render（一般别用）
  const flushDemo = () => {
    setLog(l => [...l, '──── 点了 flushSync ────'])
    // 这里需要 import { flushSync } from 'react-dom'
    push('不加 flushSync：两个 setN 同事件合并成 1 次 render')
    setN(n + 1)
    setN(n + 1)
  }

  useEffect(() => {
    push('mount effect')
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>Demo 3：状态更新 & batching</h3>
      <p>n = <strong>{n}</strong>　m = <strong>{m}</strong>　renderSeq = <strong>{renderSeq}</strong></p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={badThree}>setN(n+1) ×3（只+1，错）</button>
        <button onClick={goodThree}>setN(prev{'=>'}prev+1) ×3（+3，对）</button>
        <button onClick={bothState}>setN + setM（batching）</button>
        <button onClick={asyncBatch}>异步回调里 set（18 也 batch）</button>
        <button onClick={flushDemo}>两次 setN(n+1) 看 batch</button>
        <button onClick={() => { setN(0); setM(0) }}>reset</button>
        <button onClick={() => force(x => x + 1)}>force re-render（不动 state）</button>
      </div>

      <pre style={{ background: '#f6f8fa', padding: 12, marginTop: 16, fontSize: 12, maxHeight: 320, overflow: 'auto' }}>
{log.join('\n') || '（点按钮看 log）'}
      </pre>

      <pre style={{ background: '#eef', padding: 12, marginTop: 12, fontSize: 12 }}>
{`要点：

1. setState 入队，不立即改 state。当代码同步往下走时 n 还是旧值，
   想拿到「这次更新后的值」只能用函数式更新 prev => ...

2. batching：同一次「事件循环 / 微任务区间」内多次 setState 合并成 1 次 render。
   - React 17 及以前：只有 React 事件处理器里合并，
     setTimeout / fetch.then 里连调 setN setM 会触发两次 render。
   - React 18 起：所有地方都自动合并（automatic batching）。
     本 demo 「异步回调」按钮就能验证 → 按一次只跳 1 格。

3. 函数式更新：
     setN(n + 1)      闭包捕获当前这次事件里的 n（旧值），多次也只 +1
     setN(prev=>prev+1)  React 把更新入队，prev 是「队列里最新的那个」，多次会累加

4. useState(() => initValue) 传函数只跑一次（惰性初始化）；
   useState(initValue) 传值则每次 render 都会求值（虽然结果不会被用）。

5. flushSync(() => setN(...)) 能强制立即 render，几乎用不到，
   除非你要在 setState 后立刻同步读 DOM（比如 scrollIntoView）。`}
      </pre>
    </div>
  )
}