import { useEffect, useRef } from 'react'
import { entryVisualState } from '../motion/entryVisualState.js'

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform float uResolve;
uniform vec2 uCssSize;
/*
 * "Seascape" by Alexander Alekseev aka TDM - 2014
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Contact: tdmaav@gmail.com
 */

const int NUM_STEPS = 32;
const float PI	 	= 3.141592;
const float EPSILON	= 1e-3;
#define EPSILON_NRM (0.1 / iResolution.x)
//#define AA

// sea
const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.0, 0.055, 0.22);
const vec3 SEA_WATER_COLOR = vec3(0.18, 0.68, 1.0) * 0.68;
#define SEA_TIME (1.0 + iTime * SEA_SPEED)
const mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}
float hash( vec2 p ) {
	float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
}
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// lighting
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}
float specular(vec3 n,vec3 l,vec3 e,float s) {    
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = (max(e.y,0.0)*0.8+0.2)*0.8;
    float horizon = 1.0-e.y;
    return vec3(0.37 + horizon*horizon*0.52, 0.7 + horizon*0.23, 1.0) * 1.08;
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_GEOMETRY; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
    float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
    fresnel = min(fresnel * fresnel * fresnel, 0.5);
    
    vec3 reflected = getSkyColor(reflect(eye, n));    
    vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12; 
    
    vec3 color = mix(refracted, reflected, fresnel);
    
    float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;
    
    color += specular(n, l, eye, 600.0 * inversesqrt(dot(dist,dist)));
    
    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);    
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
    float tm = 0.0;
    float tx = 1000.0;    
    float hx = map(ori + dir * tx);
    if(hx > 0.0) {
        p = ori + dir * tx;
        return tx;   
    }
    float hm = map(ori);    
    for(int i = 0; i < NUM_STEPS; i++) {
        float tmid = mix(tm, tx, hm / (hm - hx));
        p = ori + dir * tmid;
        float hmid = map(p);        
        if(hmid < 0.0) {
            tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }        
        if(abs(hmid) < EPSILON) break;
    }
    return mix(tm, tx, hm / (hm - hx));
}

vec3 getPixel(in vec2 coord, float time) {    
    vec2 uv = coord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;    
        
    // ray
    vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);    
    vec3 ori = vec3(0.0,3.5,time*5.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); dir.z += length(uv) * 0.14;
    dir = normalize(dir) * fromEuler(ang);
    // Above the horizon the water blend is zero; avoid an unused height/normal trace.
    if (dir.y >= 0.0) return getSkyColor(dir);
    
    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8)); 
             
    // color
    return mix(
        getSkyColor(dir),
        getSeaColor(p,n,light,dir,dist),
    	pow(1.0 - smoothstep(-0.02,0.0,dir.y),0.2));
}

// main
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    float time = iTime * 0.3 + iMouse.x*0.01;
	
#ifdef AA
    vec3 color = vec3(0.0);
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
        	vec2 uv = fragCoord+vec2(i,j)/3.0;
    		color += getPixel(uv, time);
        }
    }
    color /= 9.0;
#else
    vec3 color = getPixel(fragCoord, time);
#endif
    
    // post
	fragColor = vec4(pow(max(color, vec3(0.0)),vec3(0.65)), 1.0);
}


float inkDot(vec2 position, float angle, float ink) {
  float c = cos(angle), s = sin(angle);
  vec2 cell = fract(mat2(c, -s, s, c) * position / 3.2) - .5;
  float radius = sqrt(clamp(ink, 0.0, 1.0)) * .53;
  return 1.0 - smoothstep(radius - .085, radius + .085, length(cell));
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float p = (uv.x + .17) / 1.38;
  float spine = .57 + sin(p * 6.7544242 + .4) * .13;
  float distanceToSpine = abs((1.0 - uv.y) - spine);
  float threshold = .46 + .36 * exp(-pow(distanceToSpine / .14, 2.0));
  float alpha = 1.0 - smoothstep(threshold - .12, threshold + .16, uResolve);
  // Already-revealed paper pixels no longer need the expensive ocean trace.
  if (alpha <= .003) { gl_FragColor = vec4(0.0); return; }
  mainImage(gl_FragColor, gl_FragCoord.xy);
  vec3 sea = gl_FragColor.rgb;
  float light = dot(sea, vec3(.2126, .7152, .0722));
  // Soft print bands and cyan contour ink retain the underlying water detail.
  vec3 printColor = mix(vec3(.025, .09, .36), vec3(.82, .97, 1.0), smoothstep(.08, .93, light));
  vec3 bands = floor(printColor * 9.0 + .5) / 9.0;
  sea = mix(sea, mix(printColor, bands, .28), .36);
  float contour = 1.0 - smoothstep(.015, .065, abs(fract(light * 8.0) - .5));
  sea = mix(sea, vec3(.3, .83, 1.0), contour * .16 * smoothstep(.1, .65, light));
  vec3 paper = vec3(.9765, .9804, .9765);
  // Fine CMY screen in CSS pixels, composited with the water in this same pass.
  vec2 printPosition = uv * uCssSize;
  vec3 ink = 1.0 - clamp(sea, 0.0, 1.0);
  vec3 printDots = paper * (1.0 - vec3(
    inkDot(printPosition, .261799, ink.r),
    inkDot(printPosition, 1.308997, ink.g),
    inkDot(printPosition, 0.0, ink.b)));
  sea = mix(sea, printDots, .35);
  vec3 dryInk = mix(paper, vec3(.12, .32, .68), (1.0 - light) * .34);
  sea = mix(sea, dryInk, smoothstep(0.0, .58, uResolve));
  gl_FragColor = vec4(sea, alpha);
}
`

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed'
    gl.deleteShader(shader)
    throw new Error(message)
  }
  return shader
}

export default function SeascapeEntryCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
    if (!canvas || !gl) return undefined

    let program
    let vertexShader
    let fragmentShader
    try {
      vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
      fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
      program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Shader linking failed')
      }
      canvas.dataset.shaderReady = 'true'
      delete canvas.dataset.shaderError
    } catch (error) {
      canvas.dataset.shaderError = error instanceof Error ? error.message : String(error)
      return undefined
    }

    const vertices = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'aPosition')
    const resolution = gl.getUniformLocation(program, 'iResolution')
    const time = gl.getUniformLocation(program, 'iTime')
    const mouse = gl.getUniformLocation(program, 'iMouse')
    const resolve = gl.getUniformLocation(program, 'uResolve')
    const cssSize = gl.getUniformLocation(program, 'uCssSize')
    gl.useProgram(program)
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    let frame = 0
    let active = false
    let elapsed = 0
    let previous = null
    let cssWidth = 1
    let cssHeight = 1
    let renderQuality = window.innerWidth <= 760 ? .58 : .52
    let frameWindowStarted = 0
    let frameWindowTotal = 0
    let frameWindowCount = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')

    const resizeFramebuffer = () => {
      // Use layout dimensions; entrance transforms must never reallocate the framebuffer.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35)
      const width = Math.max(1, Math.round(cssWidth * pixelRatio * renderQuality))
      const height = Math.max(1, Math.round(cssHeight * pixelRatio * renderQuality))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
      gl.uniform2f(cssSize, cssWidth, cssHeight)
      canvas.dataset.renderScale = renderQuality.toFixed(2)
    }

    const resize = () => {
      cssWidth = Math.max(1, canvas.clientWidth)
      cssHeight = Math.max(1, canvas.clientHeight)
      resizeFramebuffer()
    }

    const tuneFramebuffer = (delta, now) => {
      // The shader keeps all of its geometry and halftone treatment. Only its internal
      // framebuffer follows the device's measured frame budget, avoiding a stutter loop
      // on high-DPI or integrated-GPU displays.
      if (!frameWindowStarted) frameWindowStarted = now
      frameWindowTotal += delta
      frameWindowCount += 1
      if (now - frameWindowStarted < 480 || frameWindowCount < 3) return
      const average = frameWindowTotal / frameWindowCount
      const ceiling = window.innerWidth <= 760 ? .7 : .68
      let next = renderQuality
      if (average > 34) next = Math.max(.22, renderQuality * .74)
      else if (average > 25) next = Math.max(.3, renderQuality * .86)
      else if (average < 18 && renderQuality < ceiling) next = Math.min(ceiling, renderQuality + .035)
      if (Math.abs(next - renderQuality) >= .015) {
        renderQuality = next
        resizeFramebuffer()
      }
      frameWindowStarted = now
      frameWindowTotal = 0
      frameWindowCount = 0
    }

    const draw = (now) => {
      if (!active || document.hidden || reduced.matches) { previous = null; return }
      const delta = previous === null ? 16.67 : Math.min(now - previous, 50)
      elapsed += delta
      previous = now
      gl.useProgram(program)
      gl.uniform3f(resolution, canvas.width, canvas.height, 1)
      gl.uniform1f(time, elapsed * .001)
      gl.uniform4f(mouse, 0, 0, 0, 0)
      gl.uniform1f(resolve, entryVisualState.resolve)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      tuneFramebuffer(delta, now)
      frame = window.requestAnimationFrame(draw)
    }

    const restart = () => {
      window.cancelAnimationFrame(frame)
      elapsed = 0
      previous = null
      frameWindowStarted = 0
      frameWindowTotal = 0
      frameWindowCount = 0
      active = true
      frame = window.requestAnimationFrame(draw)
    }
    const stop = () => { active = false; previous = null; window.cancelAnimationFrame(frame) }
    const sync = () => {
      window.cancelAnimationFrame(frame)
      previous = null
      if (active && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('portfolio:home-opening-start', restart)
    window.addEventListener('portfolio:home-opening-complete', stop)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    // Force deferred shader compilation against a one-pixel target while the
    // opening is still blank, instead of paying that cost on its first visible frame.
    canvas.width = 1
    canvas.height = 1
    gl.viewport(0, 0, 1, 1)
    gl.uniform3f(resolution, 1, 1, 1)
    gl.uniform2f(cssSize, 1, 1)
    gl.uniform1f(time, 0)
    gl.uniform4f(mouse, 0, 0, 0, 0)
    gl.uniform1f(resolve, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    resize()
    if (canvas.closest('#title')?.dataset.d1101Opening === 'armed') restart()

    return () => {
      active = false
      window.cancelAnimationFrame(frame)
      window.removeEventListener('portfolio:home-opening-start', restart)
      window.removeEventListener('portfolio:home-opening-complete', stop)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      observer.disconnect()
      gl.deleteBuffer(vertices)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return <canvas ref={canvasRef} className="marlsa-entry-ocean-canvas" aria-hidden="true" />
}
