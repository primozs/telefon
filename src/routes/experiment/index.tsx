// https://www.getcontrast.io/learn/using-document-picture-in-picture-and-insertable-streams-apis-to-record-your-screen-and-camera
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
// https://dev.to/anthonys1760/how-to-create-a-screen-sharing-application-with-javascript-4h6j
// https://developer.chrome.com/blog/screensharing-with-webrtc/
// https://github.com/samdutton/rtcshare
import { component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <div>
      <button
        class="btn"
        onClick$={async () => {
          // Open a Picture-in-Picture window.
          // @ts-ignore
          if (!documentPictureInPicture) return;
          // @ts-ignore
          const pipWindow = await documentPictureInPicture.requestWindow();

          // Add any style sheet that will be needed in the Picture-in-Picture window.
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "/style.css";
          pipWindow.document.head.appendChild(link);

          // Get screen and camera streams.
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });

          // Use MediaStreamTrackProcess to consume screen frames.
          // const screenProcessor = new MediaStreamTrackProcessor({
          //   track: screenStream.getVideoTracks()[0],
          // });

          // let screenFrame: any;
          // const screenReader = screenProcessor.readable.getReader();
          // screenReader.read().then(function saveScreenFrame({
          //   done,
          //   value: frame,
          // }: any) {
          //   screenFrame?.close();
          //   screenFrame = frame;
          //   if (done) {
          //     return;
          //   }
          //   return screenReader.read().then(saveScreenFrame);
          // });

          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          const cameraVideo = document.createElement("video");
          cameraVideo.srcObject = cameraStream;
          cameraVideo.autoplay = true;
          cameraVideo.muted = true;

          // Insert the camera video element into the Picture-in-Picture window.
          pipWindow.document.body.appendChild(cameraVideo);
        }}
      >
        start
      </button>

      <button class="btn">stop</button>
    </div>
  );
});
