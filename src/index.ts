import { Renderer } from './renderer'
import { Mesh, RectMesh } from './mesh'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const meshes: Mesh[] = [
  new RectMesh({
    topLeft: { x: -10, y: 10, z: 10 },
    topRight: { x: 10, y: 10, z: 10 },
    bottomRight: { x: 10, y: -10, z: 10 },
    bottomLeft: { x: -10, y: -10, z: 10 },
  }),
  new RectMesh({
    topLeft: { x: 10, y: 10, z: 10 },
    topRight: { x: 10, y: 10, z: -10 },
    bottomRight: { x: 10, y: -10, z: -10 },
    bottomLeft: { x: 10, y: -10, z: 10 },
  }),
  new RectMesh({
    topLeft: { x: -10, y: 10, z: 10 },
    topRight: { x: -10, y: 10, z: -10 },
    bottomRight: { x: -10, y: -10, z: -10 },
    bottomLeft: { x: -10, y: -10, z: 10 },
  }),
]
const renderer = new Renderer({
  canvas: canvas,
  canvasWidth: 640,
  canvasHeight: 480,
  meshes: meshes,
})
renderer.start()

let oscillateIntervalId: number
let oscillateIncrementer = 2
document.getElementById('oscillate-fov').addEventListener('click', () => {
  if (oscillateIntervalId) {
    window.clearInterval(oscillateIntervalId)
    oscillateIntervalId = null
    return
  }

  oscillateIntervalId = window.setInterval(() => {
    if (renderer.d > 300) {
      oscillateIncrementer = -2
    }
    if (renderer.d < 50) {
      oscillateIncrementer = 2
    }

    renderer.d += oscillateIncrementer

  }, 1000 / renderer.fps)
})

document.addEventListener('keydown', event => {
  const input = Object.assign({}, renderer.camera.keyboardInput)
  
  if (event.code === 'KeyW') {
    input.w = new Date()
  }
  if (event.code === 'KeyA') {
    input.a = new Date()
  }
  if (event.code === 'KeyS') {
    input.s = new Date()
  }
  if (event.code === 'KeyD') {
    input.d = new Date()
  }
  if (event.code === 'KeyQ') {
    input.q = new Date()
  }
  if (event.code === 'KeyE') {
    input.e = new Date()
  }

  renderer.camera.setKeyboardInput(input)
})

document.addEventListener('keyup', event => {
  const input = Object.assign({}, renderer.camera.keyboardInput)

  if (event.code === 'KeyW') {
    input.w = null
  }
  if (event.code === 'KeyA') {
    input.a = null
  }
  if (event.code === 'KeyS') {
    input.s = null
  }
  if (event.code === 'KeyD') {
    input.d = null
  }
  if (event.code === 'KeyQ') {
    input.q = null
  }
  if (event.code === 'KeyE') {
    input.e = null
  }

  renderer.camera.setKeyboardInput(input)
})
