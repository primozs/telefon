import {
  $,
  type NoSerialize,
  component$,
  useStore,
  useVisibleTask$,
  noSerialize,
} from "@builder.io/qwik";
import { type DocumentHead, routeLoader$, Link } from "@builder.io/qwik-city";
import { type Socket, io } from "socket.io-client";
import { IncomingCall } from "~/components/incoming-call";
import { RoomHeader } from "~/components/room-header";
import { Video } from "~/components/video";
import { VideoCallWidgets } from "~/components/video-call-widgets";

type Store = {
  users: string[];
  peer?: NoSerialize<RTCPeerConnection>;
  socket?: NoSerialize<Socket>;
  remoteUser?: string;
  currentUser?: string;
  remoteStream?: NoSerialize<MediaStream>;
  isIncomingCall?: boolean;
  incomingPayload?: Record<string, any>;
  isCallAccepted?: boolean;
  userStream?: NoSerialize<MediaStream>;
  userScreenStream?: NoSerialize<MediaStream>;
  senders: (NoSerialize<RTCRtpSender> | undefined)[];
  isUserCameraOn?: boolean;
  isUserMicOn?: boolean;
  isCalling: boolean;
  call?: NoSerialize<HTMLAudioElement>;
};

export const useRoom = routeLoader$(({ params }) => {
  return {
    roomId: params.roomId,
  };
});

export const useRoomState = () => {
  const roomSig = useRoom();
  const store = useStore<Store>({
    users: [],
    isUserCameraOn: true,
    isUserMicOn: true,
    isCalling: false,
    senders: [],
  });

  const handleICECandidateEvent = $((e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      console.log("ice", e.candidate);
      const payload = {
        target: store.remoteUser,
        candidate: e.candidate,
      };
      store.socket?.emit("ice-candidate", payload);
    }
  });

  const handleTrackEvent = $((e: RTCTrackEvent) => {
    console.log("remote track", e.streams);
    store.remoteStream = noSerialize(e.streams[0]);
  });

  const handleNegotiationNeededEvent = $(async (userId: string) => {
    try {
      const offer = await store.peer?.createOffer();
      console.log("handleNegotiationNeededEvent");
      await store.peer?.setLocalDescription(offer);
      const payload = {
        target: userId,
        caller: store.currentUser,
        sdp: store.peer?.localDescription,
      };
      console.log("payload", payload);
      store.socket?.emit("offer", payload);
    } catch (error) {
      console.log(error);
    }
  });

  const createPeer = $((userId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stunserver.stunprotocol.org",
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    peer.addEventListener("icecandidate", handleICECandidateEvent);
    peer.addEventListener("track", handleTrackEvent);
    peer.addEventListener("negotiationneeded", (e) => {
      handleNegotiationNeededEvent(userId);
    });
    return peer;
  });

  const callUser = $(async (userId: string) => {
    const peer = await createPeer(userId);
    store.peer = noSerialize(peer);
    store.userStream
      ?.getTracks()
      .forEach((track) =>
        store.senders.push(
          noSerialize(store.peer?.addTrack(track, store.userStream!))
        )
      );
    store.remoteUser = userId;
    store.isCalling = true;
    store.call?.play();
  });

  const handleRejectCall = $(() => {
    store.isIncomingCall = false;
    store.incomingPayload = {};
    store.remoteUser = "";
  });

  const handleReceiveCall = $(async () => {
    console.log("incoming offer", store.incomingPayload);
    const peer = await createPeer(store.remoteUser!);
    store.peer = noSerialize(peer);
    const desc = new RTCSessionDescription(store.incomingPayload?.sdp);
    await store.peer?.setRemoteDescription(desc);
    store.userStream
      ?.getTracks()
      .forEach((track) =>
        store.senders.push(
          noSerialize(store.peer?.addTrack(track, store.userStream!))
        )
      );

    const answer = await store.peer?.createAnswer();
    await store.peer?.setLocalDescription(answer);
    const payload = {
      target: store.incomingPayload?.caller,
      caller: store.currentUser,
      sdp: store.peer?.localDescription,
    };
    store.socket?.emit("answer", payload);
    store.isIncomingCall = false;
    store.incomingPayload = {};
    store.isCallAccepted = true;
  });

  const stopCalling = $(() => {
    console.log("store.remoteUser", store.remoteUser);
    store.peer?.close();
    store.peer = undefined;
    store.call?.pause();
    store.isCalling = false;

    store.socket?.emit("end-call", {
      from: store.currentUser,
      to: store.remoteUser,
    });
  });

  const handleHangUp = $(() => {
    store.socket?.emit("end-call", {
      from: store.currentUser,
      to: store.remoteUser,
    });

    if (store.remoteStream?.active) {
      const tracks = store.remoteStream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
    }

    store.isCallAccepted = false;
    store.remoteUser = "";
  });

  const handleRemoteCallEnd = $(() => {
    if (store.remoteStream?.active) {
      const tracks = store.remoteStream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
    }

    store.isCallAccepted = false;
    store.isIncomingCall = false;
    store.remoteUser = "";
  });

  const handleAnswer = $(async (message: any) => {
    if (!store.isCalling) return;

    console.log("incoming answer", message);
    store.call?.pause();
    store.remoteUser = message.caller;
    const desc = new RTCSessionDescription(message.sdp);
    await store.peer?.setRemoteDescription(desc);
    store.isCallAccepted = true;
    store.isCalling = false;
  });

  const handleNewICECandidateMsg = $(async (incoming: RTCIceCandidateInit) => {
    console.log("incoming ice", incoming);
    const candidate = new RTCIceCandidate(incoming);
    await store.peer?.addIceCandidate(candidate);
  });

  useVisibleTask$(async () => {
    store.call = noSerialize(new Audio("/sound/phone-calling-1.mp3"));

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    store.userStream = noSerialize(stream);
    return () => {
      if (store.remoteStream?.active) {
        const tracks = store.remoteStream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }

      if (store.userStream?.active) {
        const tracks = store.userStream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }

      if (store.userScreenStream?.active) {
        const tracks = store.userScreenStream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }
    };
  });

  useVisibleTask$(() => {
    const socket = io();

    socket.on("connect", () => {
      store.currentUser = socket.id;
    });
    socket.emit("join-room", roomSig.value.roomId);

    socket.on("users", (data) => {
      store.users = data;
    });

    socket.on("user-joined", (user) => {
      store.users = [...store.users, user];
    });

    socket.on("user-left", (user) => {
      store.users = store.users.filter((u) => u !== user);
    });

    socket.on("offer", (data) => {
      console.log("offer received", data);
      store.isIncomingCall = true;
      store.incomingPayload = data;
      store.remoteUser = data.caller;
    });
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleNewICECandidateMsg);
    socket.on("end-call", handleRemoteCallEnd);

    store.socket = noSerialize(socket);
  });

  return {
    store,
    callUser,
    stopCalling,
    handleHangUp,
    handleReceiveCall,
    handleRejectCall,
  };
};

export default component$(() => {
  const roomStateProps = useRoomState();
  const { store, handleReceiveCall, handleRejectCall } = roomStateProps;

  return (
    <div class="p-4">
      <RoomHeader roomStateProps={roomStateProps} />

      {store.isIncomingCall && (
        <IncomingCall
          caller={store.incomingPayload?.caller}
          receiveCall$={handleReceiveCall}
          rejectCall$={handleRejectCall}
        />
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Video user={store.currentUser} stream={store.userStream} />
        {!!store.userScreenStream && (
          <Video user={store.currentUser} stream={store.userScreenStream} />
        )}
        {!!store.remoteStream && (
          <Video user={store.remoteUser} stream={store.remoteStream} />
        )}
      </div>

      <VideoCallWidgets roomStateProps={roomStateProps} />
    </div>
  );
});

export const head: DocumentHead = ({ params }) => ({
  title: `Room | ${params.roomId}`,
});
