import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createCarouselWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgCarousel",
    type: "carousel",
    label: "Carousel",
    props: {
      autoPlay: true,
      interval: 3000,
      showDots: true,
      showArrows: true,
      arrowPosition: "inside",
      dotPosition: "bottom",
      transition: "slide",
      transitionDuration: 300,
      pauseOnHover: true,
      loop: true,
      initialIndex: 0,
    },
    style: { width: "100%", height: "400px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 800, h: 400, zIndex: 1 },
    children: [],
  };
}
