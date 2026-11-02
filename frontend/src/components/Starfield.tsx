import { useMemo } from 'react';
import { buildStarLayer } from '@/lib/starLayers';
import nightSky from '@/assets/night-sky.webp';

/**
 * Three parallax star layers, each a single element carrying its stars as
 * box-shadows. Purely declarative — no animation loop, so the graph canvas
 * keeps the page's only requestAnimationFrame to itself.
 */
export function Starfield({ immersive = false }: { immersive?: boolean }) {
  const layers = useMemo(
    () => ({
      far: buildStarLayer({ count: 260, seed: 0x5eed }),
      mid: buildStarLayer({ count: 120, seed: 0xc0ffee }),
      near: buildStarLayer({ count: 45, seed: 0xbeef }),
    }),
    [],
  );

  return (
    <div className={`starfield${immersive ? ' starfield--immersive' : ''}`} aria-hidden="true">
      <img className="starfield__landscape" src={nightSky} alt="" fetchPriority="high" decoding="async" />
      <div className="starfield__shade" />
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
