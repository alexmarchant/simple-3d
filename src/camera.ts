import { Vertex, Rotation3D, Vector3D, Vector2D } from './common'

export interface KeyboardInput {
  w?: Date
  a?: Date
  s?: Date
  d?: Date
  q?: Date
  e?: Date
  up?: Date
  down?: Date
  left?: Date
  right?: Date
}

interface ActiveKeyboardInput {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  q: boolean
  e: boolean
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

export class Camera {
  position: Vertex
  rotation: Rotation3D
  movementSpeed = 100
  rotationSpeed = 90
  keyboardInput: KeyboardInput
  activeKeyboardInput: ActiveKeyboardInput
  pxElement: HTMLElement
  pyElement: HTMLElement
  pzElement: HTMLElement
  rxElement: HTMLElement
  ryElement: HTMLElement

  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
    this.rotation = { x: 0, y: 0 }
    this.keyboardInput = {}
    this.activeKeyboardInput = {
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      e: false,
      up: false,
      down: false,
      left: false,
      right: false,
    }
  }

  move(ms: number) {
    const movementVector = this.calcMovementVector()
    this.position.x += movementVector.x * (ms / 1000)
    this.position.y += movementVector.y * (ms / 1000)
    this.position.z += movementVector.z * (ms / 1000)
    this.showPosition()

    const rotationVector = this.calcRotationVector()
    this.rotation.x += rotationVector.x * (ms / 1000)
    this.rotation.y += rotationVector.y * (ms / 1000)
    this.showRotation()
  }

  calcMovementVector(): Vector3D {
    let movementVector = { x: 0, y: 0, z: 0 }

    if (this.activeKeyboardInput.q) {
      movementVector.y = this.movementSpeed
    }
    if (this.activeKeyboardInput.e) {
      movementVector.y = -this.movementSpeed
    }

    if (!this.isMoving) {
      return movementVector
    }

    const angle = this.calcMovementAngle()
    const absoluteAngle = this.rotation.x + angle
    const radians = absoluteAngle * (Math.PI / 180)
    movementVector.x = Math.sin(radians) * this.movementSpeed
    movementVector.z = Math.cos(radians) * this.movementSpeed

    return movementVector
  }

  get isMoving(): boolean {
    return this.activeKeyboardInput.w ||
      this.activeKeyboardInput.a ||
      this.activeKeyboardInput.s ||
      this.activeKeyboardInput.d
  }

  calcMovementAngle(): number {
    if (this.activeKeyboardInput.w) {
      if (this.activeKeyboardInput.d) {
        return 45
      }
      if (this.activeKeyboardInput.a) {
        return 315
      }
      return 0
    }
    if (this.activeKeyboardInput.s) {
      if (this.activeKeyboardInput.d) {
        return 135
      }
      if (this.activeKeyboardInput.a) {
        return 225
      }
      return 180
    }
    if (this.activeKeyboardInput.d) {
      return 90
    }
    if (this.activeKeyboardInput.a) {
      return 270
    }
    return 0
  }

  setKeyboardInput(input: KeyboardInput) {
    this.keyboardInput = input
    this.activeKeyboardInput = this.calcActiveKeyboardInput()
  }

  calcActiveKeyboardInput(): ActiveKeyboardInput {
    const activeKeyboardInput: ActiveKeyboardInput = {
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      e: false,
      up: false,
      down: false,
      left: false,
      right: false,
    }

    // Move forward backward
    if (this.keyboardInput.w && this.keyboardInput.s) {
      if (this.keyboardInput.w.getTime() > this.keyboardInput.s.getTime()) {
        activeKeyboardInput.w = true
      } else {
        activeKeyboardInput.s = true
      }
    } else if (this.keyboardInput.w) {
      activeKeyboardInput.w = true
    } else if (this.keyboardInput.s) {
      activeKeyboardInput.s = true
    }

    // Move left right
    if (this.keyboardInput.a && this.keyboardInput.d) {
      if (this.keyboardInput.a.getTime() > this.keyboardInput.d.getTime()) {
        activeKeyboardInput.a = true
      } else {
        activeKeyboardInput.d = true
      }
    } else if (this.keyboardInput.a) {
      activeKeyboardInput.a = true
    } else if (this.keyboardInput.d) {
      activeKeyboardInput.d = true
    }

    // Move up and down
    if (this.keyboardInput.q && this.keyboardInput.e) {
      if (this.keyboardInput.q.getTime() > this.keyboardInput.e.getTime()) {
        activeKeyboardInput.q = true
      } else {
        activeKeyboardInput.e = true
      }
    } else if (this.keyboardInput.q) {
      activeKeyboardInput.q = true
    } else if (this.keyboardInput.e) {
      activeKeyboardInput.e = true
    }

    // Rotate left right
    if (this.keyboardInput.left && this.keyboardInput.right) {
      if (this.keyboardInput.left.getTime() > this.keyboardInput.right.getTime()) {
        activeKeyboardInput.left = true
      } else {
        activeKeyboardInput.right = true
      }
    } else if (this.keyboardInput.left) {
      activeKeyboardInput.left = true
    } else if (this.keyboardInput.right) {
      activeKeyboardInput.right = true
    }

    // Rotate up down
    if (this.keyboardInput.up && this.keyboardInput.down) {
      if (this.keyboardInput.up.getTime() > this.keyboardInput.down.getTime()) {
        activeKeyboardInput.up = true
      } else {
        activeKeyboardInput.down = true
      }
    } else if (this.keyboardInput.up) {
      activeKeyboardInput.up = true
    } else if (this.keyboardInput.down) {
      activeKeyboardInput.down = true
    }

    return activeKeyboardInput
  }

  calcRotationVector(): Vector2D {
    const rotationVector = { x: 0, y: 0 }

    if (this.activeKeyboardInput.left) {
      rotationVector.x = -this.rotationSpeed
    }
    if (this.activeKeyboardInput.right) {
      rotationVector.x = this.rotationSpeed
    }
    if (this.activeKeyboardInput.up) {
      rotationVector.y = this.rotationSpeed
    }
    if (this.activeKeyboardInput.down) {
      rotationVector.y = -this.rotationSpeed
    }

    return rotationVector
  }

  showPosition() {
    if (!this.pxElement) {
      this.pxElement = document.getElementById('px')
    }
    if (!this.pyElement) {
      this.pyElement = document.getElementById('py')
    }
    if (!this.pzElement) {
      this.pzElement = document.getElementById('pz')
    }
    this.pxElement.innerText = Math.round(this.position.x).toString()
    this.pyElement.innerText = Math.round(this.position.y).toString()
    this.pzElement.innerText = Math.round(this.position.z).toString()
  }

  showRotation() {
    if (!this.rxElement) {
      this.rxElement = document.getElementById('rx')
    }
    if (!this.ryElement) {
      this.ryElement = document.getElementById('ry')
    }
    this.rxElement.innerText = Math.round(this.rotation.x).toString()
    this.ryElement.innerText = Math.round(this.rotation.y).toString()
  }
}
