import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./styles/BrandCursor.css";

/**
 * The portfolio's cursor, for the pages outside the portfolio.
 *
 * Deliberately the same object rather than a second idea. Someone who moves
 * from the hub into the portfolio should feel one product, and this is the most
 * distinctive thing either page does with a pointer; two different cursors
 * across one domain reads as inconsistency, not range.
 *
 * Rewritten rather than imported for one reason: src/components/Cursor.tsx
 * drives itself with GSAP, and GSAP is the heaviest thing in the portfolio's
 * bundle. The hub exists to be the fast front door, so it cannot pull in an
 * animation library to move a circle. The lerp below is what GSAP was doing.
 *
 * The same [data-cursor] hooks are honoured, so an element on any of these
 * pages can open the cursor into a bar or hide it exactly as it would in the
 * portfolio. They are read on every pointer move rather than bound once on
 * mount, which is what lets them work on markup that arrives later.
 */
const BrandCursor = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A real pointer only. On a touch screen there is nothing to follow and the
    // mark would sit wherever the last tap landed.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let running = false;
    let placed = false;
    let pinned = false;

    const step = () => {
      const ease = reduce.matches ? 1 : 6;
      pos.x += (mouse.x - pos.x) / ease;
      pos.y += (mouse.y - pos.y) / ease;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      // Park once it has caught up. This runs on the page every link points at,
      // and an animation frame that never exits is a repaint every frame for as
      // long as the tab is open, whether or not anything moved.
      if (Math.abs(mouse.x - pos.x) < 0.1 && Math.abs(mouse.y - pos.y) < 0.1) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || pinned) return;
      running = true;
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!placed) {
        // No glide in from the corner on the first movement.
        pos.x = mouse.x;
        pos.y = mouse.y;
        placed = true;
      }

      const target = e.target as HTMLElement | null;
      const holder = target?.closest<HTMLElement>("[data-cursor]");
      const mode = holder?.dataset.cursor;

      el.classList.toggle("cursor-disable", mode === "disable");

      if (mode === "icons" && holder) {
        const box = holder.getBoundingClientRect();
        el.classList.add("cursor-icons");
        el.style.setProperty("--cursorH", `${box.height}px`);
        el.style.transform = `translate3d(${box.left}px, ${box.top}px, 0)`;
        pinned = true;
        return;
      }

      if (pinned) {
        pinned = false;
        pos.x = mouse.x;
        pos.y = mouse.y;
      }
      el.classList.remove("cursor-icons");
      start();
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Portalled to the body. Mounted inside .hub it was a child of the element
  // the share sheet blurs, so opening the sheet blurred the cursor and put it
  // behind the sheet: a filter on an ancestor also makes it the containing
  // block for fixed children, which drops it out of the top layer entirely.
  return createPortal(
    <div className="brand-cursor" aria-hidden="true" ref={ref} />,
    document.body
  );
};

export default BrandCursor;
