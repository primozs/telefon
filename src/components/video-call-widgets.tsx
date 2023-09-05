import {
  $,
  component$,
  noSerialize,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useRoomState } from "~/routes/[roomId]";

type VideoCallWidgetsProps = {
  roomStateProps: ReturnType<typeof useRoomState>;
};

export const VideoCallWidgets = component$<VideoCallWidgetsProps>(
  ({ roomStateProps: { store, handleHangUp, stopCalling } }) => {
    const isScreenShareAvailable = useSignal(true);
    const isUserScreenSharecOn = useSignal(false);

    useVisibleTask$(() => {
      isScreenShareAvailable.value = !!navigator.mediaDevices.getDisplayMedia;
    });

    const toggleCamera = $(() => {
      const tracks = store.userStream?.getVideoTracks();
      if (tracks?.length) {
        tracks[0].enabled = !tracks[0].enabled;
        store.isUserCameraOn = tracks[0].enabled;
      }
    });

    const toggleMic = $(() => {
      const tracks = store.userStream?.getAudioTracks();
      if (tracks?.length) {
        tracks[0].enabled = !tracks[0].enabled;
        store.isUserMicOn = tracks[0].enabled;
      }
    });

    const startShareScreen = $(async () => {
      if (!isScreenShareAvailable.value) return;
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      store.userScreenStream = noSerialize(screenStream);
      isUserScreenSharecOn.value = true;

      const screenTrack = screenStream.getVideoTracks()[0];

      store.senders
        .find((sender) => sender?.track?.kind === "video")
        ?.replaceTrack(screenTrack);
    });

    const stopShareScreen = $(() => {
      if (store.userScreenStream?.active) {
        const tracks = store.userScreenStream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }
      store.userScreenStream = undefined;
      isUserScreenSharecOn.value = false;

      const cameraTrack = store.userStream?.getVideoTracks()[0];
      store.senders
        .find((sender) => sender?.track?.kind === "video")
        ?.replaceTrack(cameraTrack || null);
    });

    return (
      <>
        <div class="flex items-center justify-center space-x-2 fixed bottom-0 left-0 right-0 p-4">
          {!store.isCallAccepted && store.isCalling && (
            <button
              class="btn btn-error btn-circle"
              onClick$={stopCalling}
              title="Stop the call"
            >
              <iconify-icon
                width={24}
                height={24}
                icon="fluent:call-28-regular"
              />
            </button>
          )}

          {store.isCallAccepted && (
            <button
              class="btn btn-error btn-circle"
              onClick$={handleHangUp}
              title="Hangup"
            >
              <iconify-icon
                width={24}
                height={24}
                icon="fluent:call-28-regular"
              />
            </button>
          )}

          <button
            title="Toggle camera"
            class={["btn btn-circle", { "btn-error": !store.isUserCameraOn }]}
            onClick$={toggleCamera}
          >
            {store.isUserCameraOn ? (
              <iconify-icon width={24} height={24} icon="carbon:video" />
            ) : (
              <iconify-icon width={24} height={24} icon="carbon:video-off" />
            )}
          </button>
          <button
            class={["btn btn-circle", { "btn-error": !store.isUserMicOn }]}
            title="Toggle mic"
            onClick$={toggleMic}
          >
            {store.isUserMicOn ? (
              <iconify-icon
                width={24}
                height={24}
                icon="fluent:mic-32-regular"
              />
            ) : (
              <iconify-icon
                width={24}
                height={24}
                icon="fluent:mic-off-32-regular"
              />
            )}
          </button>
          {isScreenShareAvailable.value && (
            <button
              class={[
                "btn btn-circle",
                { "btn-error": isUserScreenSharecOn.value },
              ]}
              title="Toggle screenshare"
              onClick$={() => {
                if (isUserScreenSharecOn.value) {
                  stopShareScreen();
                } else {
                  startShareScreen();
                }
              }}
              disabled={!store.isCallAccepted}
            >
              {isUserScreenSharecOn.value ? (
                <iconify-icon
                  width={24}
                  height={24}
                  icon="fluent:share-screen-person-24-filled"
                />
              ) : (
                <iconify-icon
                  width={24}
                  height={24}
                  icon="fluent:share-screen-person-24-regular"
                />
              )}
            </button>
          )}
        </div>
      </>
    );
  }
);
