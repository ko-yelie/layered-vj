/* ----------------------------------------------------------------------------
 * velocity update shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform sampler2D videoTexture;
uniform sampler2D prevVideoTexture;
uniform sampler2D prevPictureTexture;
uniform vec2      resolution;
const float threshold = 0.1;
const float fadeoutSpeed = 0.04;
const float attenuationRate = 1. - fadeoutSpeed;
void main(){
    vec2 coord = gl_FragCoord.st / resolution;
    vec4 video = texture2D(videoTexture, coord);
    vec4 prevVideo = texture2D(prevVideoTexture, coord);
    vec4 prevPicture = texture2D(prevPictureTexture, coord);
    float diff = abs(((video.r + video.g + video.b) - (prevVideo.r + prevVideo.g + prevVideo.b))) / 3.;
    float isMove = step(threshold, diff);
    gl_FragColor = vec4(video.rgb, 1.) * isMove + vec4(prevPicture.rgb * attenuationRate * (1. - isMove), 1.);
}
