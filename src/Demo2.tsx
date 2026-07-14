import { useState, useEffect, useRef, StrictMode } from 'react'

// ─────────────────────────────────────────────────────────────────
// Demo 2：render 必须是「纯函数」& StrictMode
//
// 核心结论：
//   1. render 函数体不能有「副作用」：改全局变量、发请求、读可变外部状态、
//      随机数、Date.now()、修改 props 等都不行。
//      原因：React 随时可能「丢弃」一次 render 的结果，也可能为了检测 bug
//      而重复调用 render。如果你在 render 里干了副作用，结果就不可预测。
//r
//   2. StrictMode（开发模式）会：
//        - 双调用 render 函数体
//        - 双调用 useEffect / useLayoutEffect（先 setup、再 cleanup、再 setup）
//        - 双调用 useState 的 initializer
//      生产环境不会双调用，StrictMode 在 prod 是 no-op。
//
//   3. 「副作用」应该放在哪里？
//        - 事件处理器里（onClick 等）：用户交互触发，可以随便改
//        - useEffect 里：渲染-related 的副作用
//        - 绝对不要放在 render 函数体的顶层
//
//   4. 「计算」是允许的：useMemo / 普通变量计算都行，只要输入相同输出相同。
// ─────────────────────────────────────────────────────────────────

let renderCallCount = 0

function BadCounter() {
  renderCallCount++
  console.log(`  [BadCounter render #${renderCallCount}]`)
  return <div>BadCounter：render 已被调用 <strong>{renderCallCount}</strong> 次</div>
}

function EffectTwice() {
  const logRef = useRef<string[]>([])
  const [, force] = useState(0)

  useEffect(() => {
    const t = performance.now().toFixed(0)
    logRef.current.push(`[${t}] setup`)
    force(x => x + 1)
    return () => {
      const t2 = performance.now().toFixed(0)
      logRef.current.push(`[${t2}] cleanup`)
      force(x => x + 1)
    }
  }, [])

  return (
    <div style={{ marginTop: 8 }}>
      <div>effect log：</div>
      <pre style={{ background: '#f6f8fa', padding: 8, fontSize: 12, minHeight: 40 }}>
{logRef.current.map((l, i) => `${i}: ${l}`).join('\n') || '（挂载后看 log）'}
      </pre>
    </div>
  )
}

// 被 StrictMode 条件包裹的子内容
function Probe() {
  console.log('\n=== Probe 挂载开始 ===')
  return (
    <div style={{ padding: 8 }}>
      <BadCounter />
      <EffectTwice />
    </div>
  )
}

export function Demo2() {
  const [strict, setStrict] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)

  const remount = () => {
    renderCallCount = 0
    setMounted(false)
    // 下一个 tick 再挂载，让 BadCounter 真的卸载再挂
    requestAnimationFrame(() => setMounted(true))
  }

  const content = (
    <div style={{ marginTop: 12, border: '1px solid #337ab7', padding: 8 }}>
      <div>StrictMode：{strict ? 'ON' : 'OFF'}　tick={tick}</div>
      {mounted && <Probe key={tick} />}
    </div>
  )

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>Demo 2：render 必须是纯函数 & StrictMode</h3>

      <p>
        StrictMode：
        <button onClick={() => setStrict(s => !s)} style={{ marginLeft: 8, fontWeight: strict ? 'bold' : 'normal' }}>
          {strict ? 'ON（点击关掉）' : 'OFF（点击开启）'}
        </button>
      </p>
      <p>
        <button onClick={remount}>挂载/重新挂载子组件</button>
        <button onClick={() => setMounted(false)} style={{ marginLeft: 8 }}>卸载</button>
        <button onClick={() => setTick(t => t + 1)} style={{ marginLeft: 8 }}>key++ 强制重挂</button>
      </p>

      {strict ? <StrictMode>{content}</StrictMode> : content}

      <pre style={{ background: '#f6f8fa', padding: 12, marginTop: 16, fontSize: 12 }}>
{`用法：
  1. 默认 StrictMode=OFF，点「挂载」→ 看 Console，BadCounter render 只 1 次
  2. 切到 StrictMode=ON，再点「挂载」→ BadCounter render 变成 2 次
     effect log 也会变 setup→cleanup→setup（看到 cleanup 就证明双跑了）
  3. 卸载/重挂 对照看 cleanup

render 纯函数契约 = React 一切机制的基石：
  - React 可能丢弃一次 render（concurrent 模式下可中断）
  - React 可能重跑 render（StrictMode 双调用 / 主动 setState）
  - 只要 render 是纯的，跑几次结果都一样 → React 才敢随便优化

副作用放哪里：
  事件处理 → OK，用户明确触发的
  useEffect/useLayoutEffect → OK，渲染提交后才跑
  render 函数体顶层 → ❌ 永远不行

StrictMode 不是性能开关，是「帮你找 bug 的放大镜」：
  开发模式下双调用 render / effect / useState initializer
  如果你副作用依赖只跑一次的假设，会被它当场打脸`}
      </pre>
    </div>
  )
}