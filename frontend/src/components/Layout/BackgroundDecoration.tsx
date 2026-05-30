/**
 * 背景装饰 SVG 组件
 * 提供金色和靛蓝色的流线曲线装饰，营造「阳光图书馆」氛围
 */

export function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 左上角 - 靛蓝曲线 */}
      <svg
        className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-[0.03]"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 200 Q 150 100, 300 200 T 600 200"
          stroke="#182544"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0 250 Q 180 130, 350 250 T 600 250"
          stroke="#182544"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 300 Q 200 180, 400 300 T 600 300"
          stroke="#182544"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* 右下角 - 金色曲线 */}
      <svg
        className="absolute -bottom-32 -right-32 w-[700px] h-[700px] opacity-[0.04]"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M700 400 Q 550 500, 400 400 T 0 400"
          stroke="#775a19"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M700 450 Q 520 570, 350 450 T 0 450"
          stroke="#775a19"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M700 500 Q 500 600, 300 500 T 0 500"
          stroke="#775a19"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* 中央 - 淡金色光晕 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, #775a19 0%, transparent 70%)',
        }}
      />

      {/* 右上角 - 靛蓝光晕 */}
      <div
        className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full opacity-[0.015]"
        style={{
          background: 'radial-gradient(circle, #182544 0%, transparent 60%)',
        }}
      />
    </div>
  )
}
