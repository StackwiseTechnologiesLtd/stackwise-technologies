"use client";
import { useEffect } from 'react';

export default function ScriptLoader() {
  useEffect(() => {
    import('../styles/app.js');
  }, []);

  return null;
}
