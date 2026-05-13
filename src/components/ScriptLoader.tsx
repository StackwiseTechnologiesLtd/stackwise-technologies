"use client";
import { useEffect } from 'react';

export default function ScriptLoader() {
  useEffect(() => {
    // @ts-expect-error: Suppressing TypeScript error as app.js is a third-party JS file without types.
    import('../styles/app.js');
  }, []);

  return null;
}
