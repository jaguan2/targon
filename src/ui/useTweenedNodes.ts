import { useEffect, useRef, useState } from 'react';
import type { LayoutNode, NodeId } from './layout';

const DURATION_MS = 700;

/** Ease-in-out cubic — slow at both ends, quick through the middle. */
function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Tween node positions when the layout changes.
 *
 * CSS can transition a `<g>` transform, but not the endpoints of the `<line>`
 * elements the edges are drawn with — so the edges would snap while the nodes
 * glided. Interpolating in state keeps both in step.
 *
 * The loop is transient: it starts on a layout change and cancels itself on
 * arrival, so the page is idle the rest of the time. Skipped entirely when the
 * user has asked for reduced motion.
 */
export function useTweenedNodes(target: LayoutNode[]): LayoutNode[] {
  const [nodes, setNodes] = useState(target);
  const frameRef = useRef<number | null>(null);
  // Read positions from a ref so the effect depends only on `target`; using
  // state here would restart the tween on every frame it schedules.
  const currentRef = useRef(target);

  useEffect(() => {
    currentRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setNodes(target);
      return;
    }

    const from = new Map<NodeId, { x: number; y: number }>(
      currentRef.current.map((n) => [n.id, { x: n.x, y: n.y }]),
    );

    // Nothing to animate on first render, or when the layout is unchanged.
    const unchanged = target.every((node) => {
      const start = from.get(node.id);
      return (
        start !== undefined &&
        Math.abs(start.x - node.x) < 0.5 &&
        Math.abs(start.y - node.y) < 0.5
      );
    });
    if (unchanged) {
      setNodes(target);
      return;
    }

    const startedAt = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / DURATION_MS);
      const k = ease(t);

      setNodes(
        target.map((node) => {
          const start = from.get(node.id) ?? { x: node.x, y: node.y };
          return {
            ...node,
            x: start.x + (node.x - start.x) * k,
            y: start.y + (node.y - start.y) * k,
          };
        }),
      );

      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else frameRef.current = null;
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [target]);

  return nodes;
}
