import { useMemo } from 'react';
import { buildStarLayer } from './starLayers';

/**
 * Three parallax star layers, each a single element carrying its stars as
 * box-shadows. Purely declarative — no animation loop, so the graph canvas
 * keeps the page's only requestAnimationFrame to itself.
 */
export function Starfield() {
  const layers = useMemo(
    () => ({
      far: buildStarLayer({ count: 260, seed: 0x5eed }),
      mid: buildStarLayer({ count: 120, seed: 0xc0ffee }),
      near: buildStarLayer({ count: 45, seed: 0xbeef }),
    }),
    [],
  );

  return (
    <div className="starfield" aria-hidden="true">
      <div
        className="starfield__layer starfield__layer--far"
        style={{ boxShadow: layers.far }}
      />
      <div
        className="starfield__layer starfield__layer--mid starfield__twinkle"
        style={{ boxShadow: layers.mid }}
      />
      <div
        className="starfield__layer starfield__layer--near"
        style={{ boxShadow: layers.near }}
      />
    </div>
  );
}
