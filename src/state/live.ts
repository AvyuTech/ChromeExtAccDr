import { useEffect, useMemo, useState } from 'react';
import { PULSE } from '../data/city';
import type { CityPulse } from '../data/types';
import type { TrafficLevel } from '../icons/live';
import { useSettings } from './settings';

const TICK_MS = 20_000;

/**
 * A simulated live feed for the City pulse. Every tick roads drift a little
 * and AQI wobbles, so the heat map and the dynamic glyphs move.
 * Paused when Data saver is on or live updates are switched off.
 */
export function useLiveCity(): CityPulse & { tick: number; paused: boolean } {
  const { settings } = useSettings();
  const paused = settings.data.dataSaver || !settings.data.liveUpdates;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return useMemo(() => {
    const corridors = PULSE.corridors.map((c, i) => {
      const wobble = Math.round(Math.sin((tick + i * 3) / 2) * 1.4);
      const minutes = Math.max(c.usual - 2, c.minutes + wobble);
      const ratio = minutes / c.usual;
      const level = (ratio > 1.8 ? 3 : ratio > 1.4 ? 2 : ratio > 1.1 ? 1 : 0) as TrafficLevel;
      return { ...c, minutes, level };
    });
    const aqi = { ...PULSE.aqi, value: PULSE.aqi.value + Math.round(Math.sin(tick / 3) * 4) };
    return { ...PULSE, corridors, aqi, tick, paused, updatedAgo: paused ? 'Paused' : 'Live' };
  }, [tick, paused]);
}
