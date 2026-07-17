import { useState, useEffect, useRef, StrictMode } from 'react'

// ─────────────────────────────────────────────────────────────────
// Step 4：Render 必须是「纯函数」
//
// 这是 React 一切机制的基石。如果你违反这个规则，所有 React 的优化和
// 特性（并发渲染、自动 batching、Suspense…）都会出 bug。
//
// 纯函数 = 同样的 props/state 输入 → 同样的 JSX 输出，不碰外部世界。
//
// 副作用（改全局变量、发请求、读写 localStorage、随机数…）绝对不能
// 放在 render 函数体顶层。
//
// StrictMode 是 React 给你的"bug 探测器"：开发模式下它会双调用
// render、effect、useState initializer，让你提前发现不纯的代码。
// ─────────────────────────────────────────────────────────────────

// 这是一个"全局可变变量"——在 render 里改它就是"副作用"
let badCounter = 0

function BadCounter() {
  badCounter++ // ❌ render 里改外部变量，绝对不行
  return (
    <div style={{ fontSize: 13, marginBottom: 8 }}>
      ❌ BadCounter：render 被调用了 <strong>{badCounter}</strong> 次（每次 render +1）
    </div>
  )
}

function EffectTwice() {
  // 用 ref 记录 effect 的 setup/cleanup 调用历史
  // ref 不触发 re-render，但内容跨 render 持久化
  const logRef = useRef<string[]>([])
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const t = performance.now().toFixed(0)
    logRef.current = [...logRef.current, `[${t}ms] setup`]
    forceUpdate(x => x + 1) // 强制 re-render 以便显示最新的 log
    return () => {
      const t2 = performance.now().toFixed(0)
      logRef.current = [...logRef.current, `[${t2}ms] cleanup`]
      forceUpdate(x => x + 1)
    }
  }, [])

  const logs = logRef.current
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 4 }}>Effect 调用历史（setup / cleanup）：</div>
      <pre
        style={{
          background: '#1e293b',
          color: '#e2e8f0',
          padding: 8,
          borderRadius: 6,
          fontSize: 11,
          minHeight: 24,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {logs.length === 0
          ? '（尚未挂载）'
          : logs.map((l, i) => `[${i}] ${l}`).join('\n')}
      </pre>
    </div>
  )
}

// 被 StrictMode 包裹的子内容
function Probe({ tick }: { tick: number }) {
  console.log(`\n=== Probe 挂载 tick=${tick} ===`)
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid #94a3b8',
        borderRadius: 6,
        marginTop: 8,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Probe（key={tick}）</div>
      <BadCounter />
      <EffectTwice />
    </div>
  )
}

export function Step4() {
  const [strict, setStrict] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)

  const remount = () => {
    badCounter = 0 // 重置全局计数器
    setMounted(false)
    // 等一个动画帧再挂载，确保 React 完全卸载再重来
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }

  const keyRemount = () => {
    badCounter = 0
    setTick(t => t + 1) // 改 key → 强制卸载 + 重新挂载
    setMounted(true)
  }

  const content = (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        StrictMode：{strict ? <span style={{ color: '#dc2626', fontWeight: 700 }}>ON</span> : 'OFF'}
        {' '}| tick={tick}
      </div>
      {mounted && <Probe key={tick} tick={tick} />}
    </div>
  )

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Step 4：Render 必须是纯函数</h3>
      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
        纯函数 = 同样的输入 → 同样的输出，不碰外部世界。StrictMode 帮你找不纯的代码。
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setStrict(s => !s)} style={btnStyle}>
          StrictMode：{strict ? 'ON → 关' : 'OFF → 开'}
        </button>
        <button onClick={remount} style={btnStyle}>
          挂载/重新挂载
        </button>
        <button onClick={() => setMounted(false)} style={btnStyle}>
          卸载
        </button>
        <button onClick={keyRemount} style={btnStyle}>
          key++ 强制重挂
        </button>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          border: '2px solid #8b5cf6',
          borderRadius: 8,
          padding: 12,
          background: '#faf5ff',
          marginBottom: 16,
        }}
      >
        {strict ? <StrictMode>{content}</StrictMode> : content}
      </div>

      {/* 说明 */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>实验步骤：</div>
        <ol style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: '#334155' }}>
          <li>
            <b>StrictMode OFF → 点"挂载"：</b>BadCounter 显示 <b>1</b>，Effect 只有 <b>setup</b>。
          </li>
          <li>
            <b>开 StrictMode → 再点"挂载"：</b>BadCounter 显示 <b>2</b>（render 被双调了！），
            Effect 日志出现 <b>setup → cleanup → setup</b>（effect 也被双调了！）
          </li>
        </ol>

        <div style={{ fontSize: 13, lineHeight: 1.8, color: '#334155' }}>
          <strong>为什么要纯函数？</strong>
          <ul style={{ margin: '4px 0 12px', paddingLeft: 20 }}>
            <li>React 可以<b>随时丢弃一次 render 的结果</b>（并发模式下中断渲染）</li>
            <li>React 可以<b>随时重复调用 render</b>（StrictMode 双调、Suspense 重试）</li>
            <li>只要 render 是纯的，<b>跑几次结果都一样</b> → React 才敢随便优化</li>
          </ul>

          <strong>副作用放哪里？</strong>
          <ul style={{ margin: '4px 0 12px', paddingLeft: 20 }}>
            <li>
              <span style={{ color: '#16a34a' }}>✓</span> 事件处理器（onClick 等）——用户触发的
            </li>
            <li>
              <span style={{ color: '#16a34a' }}>✓</span> useEffect / useLayoutEffect —— commit 之后
            </li>
            <li>
              <span style={{ color: '#dc2626' }}>✗</span> render 函数体顶层 —— 永远不行
            </li>
          </ul>

          <strong>StrictMode 不是性能开关。</strong>它是 React 给你的"不纯-探测器"。
          生产环境下 StrictMode 是 no-op（什么也不做），所以开发时看到的双调用
          <b>不会影响线上用户</b>。
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
