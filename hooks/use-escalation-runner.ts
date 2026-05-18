'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { runEscalationChecks } from '@/lib/escalation-runner';

/** Runs BRD escalation rules on mount and every 5 minutes */
export function useEscalationRunner() {
  const ran = useRef(false);
  const state = useStore();

  useEffect(() => {
    const check = () => {
      const current = useStore.getState();
      const patch = runEscalationChecks(current);
      if (patch) useStore.setState(patch);
    };

    // Run immediately on first mount
    if (!ran.current) {
      ran.current = true;
      check();
    }

    // Re-run every 5 minutes so new violations are caught during a session
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
