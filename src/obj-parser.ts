import { Mesh } from './mesh'
import { Vertex, TextureMap } from './common'

interface Face {
  vertIndices: number[]
  vertTexMapIndices: number[]
}

export class ObjParser {
  objSource: string
  verts: Vertex[]
  vertTexMaps: TextureMap[]
  faces: Face[]

  constructor(objSource: string) {
    this.verts = []
    this.vertTexMaps = []
    this.faces = []
    this.objSource = objSource
    console.log('Starting parser...')
    this.parse()
    console.log(`Parsed ${this.verts.length} verts`)
    console.log(`Parsed ${this.faces.length} faces`)
  }

  parse() {
    const lines = this.objSource.split('\n')

    lines.forEach(line => {
      this.parseLine(line)
    })
  }

  parseLine(line: string) {
    if (line.match('^v ')) {
      this.parseVert(line)
    }
    if (line.match('^vt ')) {
      this.parseVertTexMaps(line)
    }
    if (line.match('^f ')) {
      this.parseFace(line)
    }
  }

  parseVert(line: string) {
    const parts = line.split(' ')
    const x = parseFloat(parts[1])
    const y = parseFloat(parts[2])
    const z = parseFloat(parts[3])
    this.verts.push({ x, y, z })
  }

  parseVertTexMaps(line: string) {
    const parts = line.split(' ')
    const u = parseFloat(parts[1])
    const v = parseFloat(parts[2])
    this.vertTexMaps.push({ u, v })
  }

  parseFace(line: string) {
    const vertIndices: number[] = []
    const vertTexMapIndices: number[] = []

    const parts = line.split(' ').slice(1)
    parts.forEach(part => {
      const partParts = part.split('/')

      // Verts
      const vertIndex = parseInt(partParts[0], 10) - 1 // OBJ is 1 indexed
      vertIndices.push(vertIndex)

      // Vert tex maps
      const vertTextMapIndex = parseInt(partParts[1], 10) - 1 // OBJ is 1 indexed
      vertTexMapIndices.push(vertTextMapIndex)
    })

    this.faces.push({
      vertIndices,
      vertTexMapIndices,
    })
  }

  meshes(): Mesh[] {
    const mesh = new Mesh()

    this.faces.forEach(face => {
      const a = this.verts[face.vertIndices[0]]
      a.texMap = this.vertTexMaps[face.vertTexMapIndices[0]]
      const b = this.verts[face.vertIndices[1]]
      b.texMap = this.vertTexMaps[face.vertTexMapIndices[1]]
      const c = this.verts[face.vertIndices[2]]
      c.texMap = this.vertTexMaps[face.vertTexMapIndices[2]]
      mesh.polygons.push({
        a,
        b,
        c,
        color: 'grey'
      })
    })

    return [mesh]
  }
}