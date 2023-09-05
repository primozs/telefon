import { component$ } from "@builder.io/qwik";
import { Themes } from "./themes";
import { RemoteUsers } from "./remote-users";
import { RoomInfo } from "./room-info";
import { Link } from "@builder.io/qwik-city";
import type { useRoomState } from "~/routes/[roomId]";

type RoomHeaderProps = {
  roomStateProps: ReturnType<typeof useRoomState>;
};

export const RoomHeader = component$<RoomHeaderProps>(({ roomStateProps }) => {
  const { store, callUser } = roomStateProps;
  return (
    <div class="pb-4 flex justify-between gap-2">
      <div class="flex gap-2">
        <Link class="btn btn-circle relative" href="/">
          <iconify-icon width={24} height={24} icon="ps:home" />
        </Link>
        <RoomInfo />
      </div>

      <div class="flex gap-2">
        <RemoteUsers
          callUser$={callUser}
          users={store.users.filter((user) => user !== store.currentUser)}
        />
        <Themes />
      </div>
    </div>
  );
});
