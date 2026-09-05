import { useEffect, useRef, useState } from 'react'

// Static topology: 92 octagonal ribs, drawn back-to-front in one GPU submission.
const VERTEX = `
attribute vec4 aVertex;
uniform vec2 uSize;
uniform float uTime;
varying vec3 vColor;
varying float vBand;
varying float vBlue;
void main() {
  float p = aVertex.x / 91.0;
  float wave = p * 6.7544242 + sin(uTime * .48) * .28;
  float ripple = sin(p * 6.2831853 - uTime * .85);
  float r = min(uSize.x * .125, uSize.y * .25) * (.79 + .24 * cos(wave)) * (1.0 + ripple * .065);
  float twist = p * 3.4 + .12 + sin(uTime * .62) * .24 + ripple * .09;
  float angle = (aVertex.y + aVertex.z) * .78539816 + twist;
  vec2 center = uSize * vec2(-.17 + p * 1.38, .57 + sin(wave + .4) * (uSize.x < 700.0 ? .08 : .13) + ripple * .015);
  vec2 point = center + vec2(cos(angle) * .48, sin(angle)) * r * mix(1.0, .7, aVertex.w);
  gl_Position = vec4(point.x / uSize.x * 2.0 - 1.0, 1.0 - point.y / uSize.y * 2.0, 0.0, 1.0);
  float shade = floor(140.0 + 63.0 * sin(aVertex.y * .78 + .5) + cos(wave) * 12.0 + .5);
  vBlue = step(34.5, aVertex.x) * (1.0 - step(54.5, aVertex.x));
  vColor = mix(vec3(shade, shade + 1.0, shade + 2.0), vec3(max(20.0, floor(shade * .12 + .5)), max(55.0, floor(shade * .31 + .5)), max(96.0, shade)), vBlue) / 255.0;
  vBand = aVertex.w;
}`
const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec3 vColor;
varying float vBand;
varying float vBlue;
uniform float uDpr;
void main() {
  float pixel = max(fwidth(vBand) * uDpr, .0001);
  float outer = 1.0 - smoothstep(0.0, pixel * 1.3, vBand);
  float inner = smoothstep(1.0 - pixel * .65, 1.0, vBand);
  vec3 rim = mix(vec3(1.0), vec3(.494, .722, 1.0), vBlue);
  vec3 shade = mix(vec3(.259, .298, .357), vec3(.016, .133, .412), vBlue);
  vec3 color = mix(vColor, rim, outer * mix(.84, .64, vBlue));
  color = mix(color, shade, inner * mix(.27, .78, vBlue));
  gl_FragColor = vec4(color, 1.0);
}`

export default function ContinuumCanvas({ active, fallback }) {
  const ref = useRef(null)
  const runtime = useRef(null)
  const activeRef = useRef(active)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (failed) return undefined
    const canvas = ref.current
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false, stencil: false, powerPreference: 'high-performance' })
    if (!gl || !gl.getExtension('OES_standard_derivatives')) { setFailed(true); return undefined }
    const shaders = []
    let program
    let buffer
    const disposeGpu = () => {
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach(shader => gl.deleteShader(shader))
    }
    try {
      program = gl.createProgram()
      for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
        const shader = gl.createShader(type)
        shaders.push(shader)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
        gl.attachShader(program, shader)
      }
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
      const vertices = []
      const corners = [[0,0], [1,0], [1,1], [0,0], [1,1], [0,1]]
      for (let rib = 91; rib >= 0; rib--) for (let face = 0; face < 8; face++) {
        for (const [side, band] of corners) vertices.push(rib, face, side, band)
      }
      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      gl.useProgram(program)
      const attribute = gl.getAttribLocation(program, 'aVertex')
      gl.enableVertexAttribArray(attribute)
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 0, 0)
    } catch {
      disposeGpu()
      setFailed(true)
      return undefined
    }
    const size = gl.getUniformLocation(program, 'uSize')
    const clock = gl.getUniformLocation(program, 'uTime')
    const dprUniform = gl.getUniformLocation(program, 'uDpr')
    let width = 1, height = 1, elapsed = 0, previous = null, frame = 0, visible = false
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(clock, elapsed)
      gl.drawArrays(gl.TRIANGLES, 0, 92 * 8 * 6)
    }
    const tick = now => {
      if (previous !== null) elapsed += Math.min((now - previous) / 1000, .05)
      previous = now
      draw()
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; previous = null
      const running = activeRef.current && visible && !document.hidden && !reduced.matches
      canvas.dataset.running = String(running)
      if (running) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight)
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      const w = Math.round(width * dpr), h = Math.round(height * dpr)
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(size, width, height)
      gl.uniform1f(dprUniform, dpr)
      draw()
    }
    const resizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    resizeObserver.observe(canvas); visibilityObserver.observe(canvas)
    const lost = event => { event.preventDefault(); setFailed(true) }
    canvas.addEventListener('webglcontextlost', lost)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    runtime.current = { sync }
    resize(); sync()
    canvas.dataset.renderer = 'webgl'
    canvas.dataset.ready = 'true'
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect(); visibilityObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', lost)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      runtime.current = null
      disposeGpu()
    }
  }, [failed])
  useEffect(() => { activeRef.current = active; runtime.current?.sync() }, [active])
  return failed ? fallback : <canvas ref={ref} className="marlsa-memory-structure" aria-hidden="true" />
}
