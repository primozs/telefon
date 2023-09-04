import { component$ } from "@builder.io/qwik";
import { Themes } from "./themes";

export const Navbar = component$(() => (
  <nav class="navbar bg-base-200">
    <div class="flex justify-between flex-1 max-w-7xl mx-auto">
      <h1 class="text-2xl font-medium">Qwik Meet</h1>
      <div class="flex items-center">
        <Themes />
      </div>
    </div>
  </nav>
));
