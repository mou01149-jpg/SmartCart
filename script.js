let stream = null;

const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const retakeBtn = document.getElementById("retakeBtn");

const result = document.getElementById("result");
const capturedImage = document.getElementById("capturedImage");

const cameraMessage = document.getElementById("cameraMessage");

async function openCamera() {

  try {

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 1280
        },
        height: {
          ideal: 720
        }
      },
      audio: false
    });

    video.srcObject = stream;

    captureBtn.disabled = false;
    retakeBtn.disabled = true;

    cameraMessage.textContent =
      "✓ Camera active — position yourself in the frame";

    document.getElementById("tryon").scrollIntoView({
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    cameraMessage.textContent =
      "❌ Camera permission was denied";

    alert(
      "Please allow camera permission in your browser and try again."
    );
  }
}


function capturePhoto() {

  if (!stream) {
    alert("Please open the camera first.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const imageData = canvas.toDataURL("image/jpeg", 0.9);

  capturedImage.src = imageData;

  result.classList.remove("hidden");

  retakeBtn.disabled = false;

  cameraMessage.textContent =
    "✓ Photo captured";

  checkImage();

  result.scrollIntoView({
    behavior: "smooth"
  });
}


function checkImage() {

  const context = canvas.getContext("2d");

  const image = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  let brightness = 0;

  for (
    let i = 0;
    i < image.data.length;
    i += 4
  ) {

    const r = image.data[i];
    const g = image.data[i + 1];
    const b = image.data[i + 2];

    brightness +=
      (r + g + b) / 3;
  }

  brightness =
    brightness /
    (image.data.length / 4);


  const checkIcon =
    document.getElementById("checkIcon");

  const checkTitle =
    document.getElementById("checkTitle");

  const checkText =
    document.getElementById("checkText");


  if (brightness < 60) {

    checkIcon.textContent = "💡";

    checkTitle.textContent =
      "Lighting is too dark";

    checkText.textContent =
      "Move to a brighter place and capture the photo again.";

  } else if (brightness > 220) {

    checkIcon.textContent = "☀️";

    checkTitle.textContent =
      "Lighting is very bright";

    checkText.textContent =
      "Avoid strong light directly facing the camera.";

  } else {

    checkIcon.textContent = "✓";

    checkTitle.textContent =
      "Photo looks good!";

    checkText.textContent =
      "The lighting appears suitable and the photo was captured successfully.";
  }
}


function retakePhoto() {

  result.classList.add("hidden");

  cameraMessage.textContent =
    "📷 Camera active — capture again";

  captureBtn.disabled = false;
}


window.addEventListener("beforeunload", () => {

  if (stream) {

    stream.getTracks().forEach(
      track => track.stop()
    );

  }

});