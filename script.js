Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  const container = document.createElement('div');
  container.style.position = 'relative';
  document.body.append(container);
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  let image;
  let canvas;
  window.onload = function(){ document.getElementById("loadingDiv").style.display = "none" }();
  var imageUpload = document.createElement("input");
  imageUpload.type = "file";
  imageUpload.id = "file";
  imageUpload.setAttribute("accept", "image/*");
  imageUpload.classList.add('imageUpload');
  var fileLabel = document.createElement("label");
  fileLabel.htmlFor = "file";
  fileLabel.id = "fileLabel";
  fileLabel.innerHTML = `<i class="material-icons">add_photo_alternate</i> Choose Photo`;
  fileLabel.classList.add('fileLabel');
  document.body.appendChild(imageUpload);
  document.body.appendChild(fileLabel);
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove();
    if (canvas) canvas.remove();
    image = await faceapi.bufferToImage(imageUpload.files[0]);
    window.onload = function(){ document.getElementById("fileLabel").style.display = "none" }();
    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    })
  })
};

function loadLabeledImages() {
  const labels = ['Black Panther (T\'Challa)','Black Widow (Natasha Romanoff)', 'Captain America (Steve Rogers)', 'Captain Marvel (Carol Danvers)', 'Hawkeye (Clint Barton)', 'Hulk (Brunce Banner)', 'Vision', 'War Machine (James Rhodes)', 'Iron Man (Tony Stark)', 'Scarlet Witch (Wanda Maximoff)', 'Thor (Thor Odinson)', 'Falcon (Sam Wilson)', 'Ant-Man (Scott Lang)', 'Spider-Man (Peter Parker)', 'Star-Lord (Peter Quill)', 'Gamora', 'Nick Fury']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/bugyejung/marvel-characters/master/${label}/${i}.jpg`);
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  )
};
