import { useMemo, useState } from 'react';
import type { NatalChart } from '../domain/chart';
import {
  rankSignsForChart,
  type ChartSignCompatibility,
  type CompatibilityMode,
} from '../domain/compatibility';

const ALL_MODES: CompatibilityMode[] = ['general', 'romantic', 'friendship'];

export interface Compatibility {
  mode: CompatibilityMode;
  setMode: (mode: CompatibilityMode) => void;
  /** Modes this chart has the placements to support. */
  availableModes: CompatibilityMode[];
  ranked: ChartSignCompatibility[];
}

/**
 * Shared compatibility state.
 *
 * Lifted out of the components so the star chart and the ranked list always
 * show the same lens — a chart that says "Leo is closest" beside a list headed
 * by Sagittarius would just look broken.
 */
export function useCompatibility(chart: NatalChart): Compatibility {
  const [requested, setRequested] = useState<CompatibilityMode>('general');

  const availableModes = useMemo(
    () =>
      ALL_MODES.filter((mode) => {
        try {
          rankSignsForChart(chart, mode);
          return true;
        } catch {
          // The chart lacks every placement this mode weighs.
          return false;
        }
      }),
    [chart],
  );

  // A date-only chart may not support the mode that was selected for a
  // previous, richer chart. Fall back rather than throwing.
  const mode = availableModes.includes(requested)
    ? requested
    : (availableModes[0] ?? 'general');

  const ranked = useMemo(
    () => rankSignsForChart(chart, mode),
    [chart, mode],
  );

  return { mode, setMode: setRequested, availableModes, ranked };
}
