export function setVariables(gl, prg) {
  prg.attLocation[0] = gl.getAttribLocation(prg.program, 'position')
  prg.attStride[0] = 3
  prg.uniLocation[0] = gl.getUniformLocation(prg.program, 'texture')
  prg.uniLocation[1] = gl.getUniformLocation(prg.program, 'time')
  prg.uniLocation[2] = gl.getUniformLocation(prg.program, 'resolution')
  prg.uniType[0] = 'uniform1i'
  prg.uniType[1] = 'uniform1f'
  prg.uniType[2] = 'uniform2fv'
}
