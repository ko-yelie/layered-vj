attribute vec3 position;
varying   vec2 vUv;

void main(){
    gl_Position = vec4(position, 1.0);
    vUv = (position.xy + 1.0) * 0.5;
}
