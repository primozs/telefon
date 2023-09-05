import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CreateRoom } from "~/components/create-room";
import { JoinRoom } from "~/components/join-room";
import { Themes } from "~/components/themes";

export default component$(() => {
  return (
    <div class="min-h-screen bg-base-100">
      <nav class="navbar bg-base-200">
        <div class="flex justify-between flex-1 max-w-7xl mx-auto">
          <h1 class="text-2xl font-medium">Telefon</h1>
          <div class="flex items-center">
            <Themes />
          </div>
        </div>
      </nav>

      <div class="hero bg-base-100 py-10">
        <div class="hero-content items-center lg:items-start max-w-7xl w-full flex-col">
          <div>
            <p class="py-6 text-lg text-center lg:text-start max-w-xl">
              Video call and screen share web app.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-6 lg:mt-0">
              <CreateRoom />
              <JoinRoom />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Qwik meet",
  meta: [
    {
      name: "description",
      content: "Qwik video meeting web app",
    },
  ],
};
