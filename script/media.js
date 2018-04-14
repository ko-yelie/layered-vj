export default function initWebcam(width, height = width){
  var video = document.createElement('video')
  video.width = width
  video.height = height
  video.loop = true

  return new Promise(resolve => {
    //Webcam video
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
    //get webcam
    navigator.getUserMedia({
      audio: true,
      video: true
    }, function(stream) {
      //on webcam enabled
      video.srcObject = stream

      function playVideo(){
        // 複数回呼ばれないようにイベントを削除
        video.removeEventListener('canplay', playVideo)
        // video 再生開始をコール
        video.play()

        resolve(video)
      }
      video.addEventListener('canplay', playVideo)
    }, function(error) {
      prompt.innerHTML = 'Unable to capture WebCam. Please reload the page.'
    })
  })
}
