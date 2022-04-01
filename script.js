const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const enableWebcamButton = document.getElementById('webcamButton');

//webcam handler
// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will 
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  // Hide the button once clicked.
  event.target.classList.add('removed');  
  
  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.addEventListener('oncanplay', predictWebcam);
  });
}

// Store the resulting model in the global scope of our app.
// Load the model.

//update frames
setInterval(()=>{
  predictWebcam();
},100);

//keep track of spawned objects
var objects = [];

async function predictWebcam() {
  
  //load model
const model = await blazeface.load();

  // Pass in an image or video to the model. The model returns an array of
  // bounding boxes, probabilities, and landmarks, one for each detected face.

  const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
  const predictions = await model.estimateFaces(video, returnTensors);

  if (predictions.length > 0) {
    //delete ears only if they can be replaced
    for (let i = 0; i < objects.length; i++) {
        liveView.removeChild(objects[i]);
      }
    objects.splice(0);
    
    /*
    `predictions` is an array of objects describing each detected face, for example:

    [
      {
        topLeft: [232.28, 145.26],
        bottomRight: [449.75, 308.36],
        probability: [0.998],
        landmarks: [
          [295.13, 177.64], // right eye
          [382.32, 175.56], // left eye
          [341.18, 205.03], // nose
          [345.12, 250.61], // mouth
          [252.76, 211.37], // r ear
          [431.20, 204.93] // l ear
        ]
      }
    ]
    */
    console.log(predictions)
    for (let i = 0; i < predictions.length; i++) {
      var TL = predictions[i].topLeft;//top left
      var TR = [predictions[i].bottomRight[0],predictions[i].topLeft[1]];//top right

      var BL = [predictions[i].topLeft[0],predictions[i].bottomRight[1]];//bottom left
      var BR = predictions[i].bottomRight;//bottom right

      var LE = predictions[i].landmarks[4];
      var RE = predictions[i].landmarks[5];

      var MO = predictions[i].landmarks[3];//mouth
      
      var wid = TR[0]-TL[0];//width
      var hei = (BR[1]-TR[1])*0.95;//height
      var angle = Math.atan2(RE[1]-LE[1],RE[0]-LE[0]);
      //holy god this algorithm took so long
      var r = Math.sqrt(0.25*(hei*hei+wid*wid));
      var DA = Math.atan2(hei*2,wid/2);//diagonal angle
      var TLR = [MO[0]-wid*3/4+Math.cos(angle-DA)*r,MO[1]-hei*1.5-Math.sin(angle-DA)*r]//top left corner w/ rotation
      
      console.log("angle"+angle+", right ear:"+RE+"left ear:"+LE);
      const ear = document.createElement('img');
      ear.setAttribute('class', 'ear');
      ear.setAttribute('src', 'catEar.png');
      //https://i.pinimg.com/originals/71/0b/92/710b929f8b4fe678535b00cd742935c8.png
      //http://clipart-library.com/images_k/transparent-cat-ears/transparent-cat-ears-2.png
      ear.style = 'left: ' + TLR[0] + 'px; top: '
          + (TLR[1]-hei) + 'px; width: ' 
          + wid + 'px; height: '
          + hei + 'px;'
          + "transform:rotate("+angle+"rad);";
      liveView.appendChild(ear);//add into the div
      objects.push(ear);//add to records

    }
  }
}