import { useEffect, useRef } from "react";
import "./styles/BrandCursor.css";

/**
 * The portfolio's cursor, for the pages outside the portfolio.
 *
 * Deliberately the same object rather than a second idea. Someone who moves
 * from the hub into the portfolio should feel one product, and this cursor is
 * the most distinctive thing either page does with a pointer; two different
 * cursors across one domain reads as inconsistency, not range.
 *
 * Rewritten rather than imported, for one reason: src/components/Cursor.tsx
 * drives itself with GSAP, and GSAP is the single heaviest thing in the
 * portfolio's bundle. The hub exists to be the fast front door, so it cannot
 * pull a 50KB animation library in to move a circle. A lerp in
 * requestAnimationFrame is what GSAP was doing here anyway.
 */
const BrandCursor = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A real pointer only. On a touch screen there is nothing to follow, and
    // the element would sit wherever the last tap landed.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let running = false;
    let placed = false;

    const step = () => {
      // Straight to the pointer when the ease would be motion for its own sake.
      const ease = reduce.matches ? 1 : 6;
      pos.x += (mouse.x - pos.x) / ease;
      pos.y += (mouse.y - pos.y) / ease;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      // Park the loop once it has caught up. This runs on the page every link
      // points at, and a requestAnimationFrame that never exits is a repaint
      // every frame for as long as the tab is open, whether or not anything
      // moved.
      if (Math.abs(mouse.x - pos.x) < 0.1 && Math.abs(mouse.y - pos.y) < 0.1) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
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
        el.classList.add("is-live");
      }

      const target = e.target as HTMLElement | null;
      const hot = !!target?.closest("a, button, [role='button'], input");
      el.classList.toggle("is-hot", hot);
      start();
    };

    const onLeave = () => el.classList.remove("is-live");
    const onEnter = () => placed && el.classList.add("is-live");

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="brand-cursor" aria-hidden="true" ref={ref}>
      <span />
    </div>
  );
};

export default BrandCursor;
