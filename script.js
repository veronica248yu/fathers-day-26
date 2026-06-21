// Interactive plant: hovering a flower "grows" it into its vegetable. Growing
// is one-way on hover — re-hovering the vegetable does NOT revert it (that felt
// glitchy because the flower and vegetable boxes overlap). To go back, CLICK
// the vegetable, which returns it to the flower. Reloading the page also resets
// every plant to its flower, since state isn't persisted.
//
// Each plant has two close-cropped PNGs (flower + vegetable). Each crop is
// positioned over the background by its own box, given as a percent of the
// stage. Whichever crop is currently shown is the interactive one.
//
// The boxes were measured by locating each crop inside the reference
// composites (match_crops.py), then re-expressed against the cropped
// 3840x2160 background (crop_background.py). They are the top-left + width as
// a percent of the canvas. Because the stage keeps the background's 16:9
// ratio, those percentages map straight onto it; height is left to `auto` so
// each crop keeps its own aspect ratio.
//
// To re-check placement, open index.html?debug to outline every crop box.

const PLANTS = [
  {
    name: "Cucumber",
    flower: { src: "assets/cuke-flower.png", box: { left: 46.37, top: 26.39, width: 5.08 } },
    vegetable: { src: "assets/cuke.png", box: { left: 44.79, top: 28.24, width: 7.69 } },
  },
  {
    name: "Pea",
    flower: { src: "assets/pea-flower.png", box: { left: 33.0, top: 55.56, width: 11.79 } },
    vegetable: { src: "assets/peas.png", box: { left: 37.55, top: 57.22, width: 11.07 } },
  },
  {
    name: "Tomato",
    flower: { src: "assets/tomato-flower.png", box: { left: 56.04, top: 46.11, width: 17.0 } },
    vegetable: { src: "assets/tomato.png", box: { left: 54.55, top: 46.9, width: 19.72 } },
  },
];

const stage = document.getElementById("stage");

if (new URLSearchParams(location.search).has("debug")) {
  stage.classList.add("is-debug");
}

const makeCrop = (state, spec) => {
  const img = document.createElement("img");
  img.className = `crop crop--${state}`;
  img.src = spec.src;
  img.alt = "";
  img.draggable = false;
  img.style.left = `${spec.box.left}%`;
  img.style.top = `${spec.box.top}%`;
  img.style.width = `${spec.box.width}%`;
  return img;
};

for (const plant of PLANTS) {
  const el = document.createElement("div");
  el.className = "plant";
  el.dataset.state = "flower";

  const flower = makeCrop("flower", plant.flower);
  const vegetable = makeCrop("vegetable", plant.vegetable);

  let grownAt = 0; // timestamp of the last grow, to ignore the same gesture's click

  const sync = () => {
    const grown = el.dataset.state === "vegetable";
    // Mark whichever crop is shown as the interactive one (keyboard + a11y);
    // the hidden crop is inert.
    const shown = grown ? vegetable : flower;
    const hidden = grown ? flower : vegetable;
    shown.setAttribute("role", "button");
    shown.tabIndex = 0;
    shown.setAttribute(
      "aria-label",
      grown
        ? `${plant.name} vegetable — activate to return to the flower`
        : `${plant.name} flower — activate to grow it`,
    );
    hidden.removeAttribute("role");
    hidden.removeAttribute("aria-label");
    hidden.tabIndex = -1;
  };

  const grow = () => {
    if (el.dataset.state === "vegetable") return; // one-way via hover
    el.dataset.state = "vegetable";
    grownAt = performance.now();
    sync();
  };

  const revert = () => {
    if (el.dataset.state === "flower") return;
    el.dataset.state = "flower";
    sync();
  };

  // Flower -> vegetable. Mouse: on hover. Touch/pen: on tap (the click below).
  flower.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") grow();
  });
  flower.addEventListener("click", grow); // touch tap; harmless no-op for mouse
  flower.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      grow();
    }
  });

  // Vegetable -> flower, on click (mouse) or tap (touch). Ignore the click that
  // belongs to the very gesture that just grew it (mouse enter+click, or the
  // tap's own click), so a single action can't grow-then-revert.
  vegetable.addEventListener("click", () => {
    if (performance.now() - grownAt < 350) return;
    revert();
  });
  vegetable.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      revert();
    }
  });

  sync();
  el.append(flower, vegetable);
  stage.append(el);
}
