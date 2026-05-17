'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { runEscalationChecks } from '@/lib/escalation-runner';

/** Runs BRD escalation rules once per session after store hydrates */
export function useEscalationRunner() {
  const ran = useRef(false);
  const state = useStore();

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const patch = runEscalationChecks(state);
    if (patch) {
      useStore.setState(patch);
    }
  }, [state]);
}
