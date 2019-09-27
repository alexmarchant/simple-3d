import { Mesh } from './mesh'
import { Vertex, TextureMap, Vector3D } from './common'

interface Face {
  vertIndices: number[]
  vertTexMapIndices: number[]
  vertNormIndices: number[]
}

export class ObjParser {
  objSource: string
  verts: Vertex[]
  vertTexMaps: TextureMap[]
  vertNorms: Vector3D[]
  faces: Face[]

  constructor(objSource: string) {
    this.verts = []
    this.vertTexMaps = []
    this.vertNorms = []
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
    if (line.match('^vn ')) {
      this.parseVertNorms(line)
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

  parseVertNorms(line: string) {
    const parts = line.split(' ')
    const x = parseFloat(parts[1])
    const y = parseFloat(parts[2])
    const z = parseFloat(parts[3])
    this.vertNorms.push({ x, y, z })
  }

  parseFace(line: string) {
    const vertIndices: number[] = []
    const vertTexMapIndices: number[] = []
    const vertNormIndices: number[] = []

    const parts = line.split(' ').slice(1)
    parts.forEach(part => {
      const partParts = part.split('/')

      // Verts
      const vertIndex = parseInt(partParts[0], 10) - 1 // OBJ is 1 indexed
      vertIndices.push(vertIndex)

      // Vert tex maps
      const vertTextMapIndex = parseInt(partParts[1], 10) - 1 // OBJ is 1 indexed
      vertTexMapIndices.push(vertTextMapIndex)

      // Vert norms
      const vertNormIndex = parseInt(partParts[2], 10) - 1 // OBJ is 1 indexed
      vertNormIndices.push(vertNormIndex)
    })

    this.faces.push({
      vertIndices,
      vertTexMapIndices,
      vertNormIndices,
    })
  }

  meshes(): Mesh[] {
    const mesh = new Mesh()

    this.faces.forEach(face => {
      const a = this.verts[face.vertIndices[0]]
      a.texMap = this.vertTexMaps[face.vertTexMapIndices[0]]
      a.norm = this.vertNorms[face.vertNormIndices[0]]
      const b = this.verts[face.vertIndices[1]]
      b.texMap = this.vertTexMaps[face.vertTexMapIndices[1]]
      b.norm = this.vertNorms[face.vertNormIndices[1]]
      const c = this.verts[face.vertIndices[2]]
      c.texMap = this.vertTexMaps[face.vertTexMapIndices[2]]
      c.norm = this.vertNorms[face.vertNormIndices[2]]
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