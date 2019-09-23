import { Renderer } from './renderer'

let renderer: Renderer

export function initPage(aRenderer: Renderer) {
  renderer = aRenderer
  handleSlider()
  handleKeypresses()
  handleRenderFlags()
}

function handleSlider() {
  document.getElementById('fov-slider').addEventListener('input', event => {
    const newVal = parseInt((event.target as HTMLInputElement).value, 10)
    renderer.d = newVal
  })
}

function handleKeypresses() {
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
}

function handleRenderFlags() {
  document.getElementById('render-polys').addEventListener('change', event => {
    renderer.renderPolys = (event.target as HTMLInputElement).checked
  })
  document.getElementById('render-edges').addEventListener('change', event => {
    renderer.renderEdges = (event.target as HTMLInputElement).checked
  })
  document.getElementById('render-verts').addEventListener('change', event => {
    renderer.renderVerts = (event.target as HTMLInputElement).checked
  })
}