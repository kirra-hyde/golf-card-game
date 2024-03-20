import { add } from "./add.js";

function start() {
  const $root = $("#root");
  $root.text(`2 + 3 = ${add(2, 3)}`);
}

start();
