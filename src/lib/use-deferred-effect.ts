import { useEffect, type DependencyList } from "react";

/** Run an effect after the current commit (avoids sync setState-in-effect lint). */
export function useDeferredEffect(
  effect: () => void | (() => void),
  deps: DependencyList,
): void {
  useEffect(() => {
    let cleanup: void | (() => void);
    const handle = window.setTimeout(() => {
      cleanup = effect();
    }, 0);
    return () => {
      window.clearTimeout(handle);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps
  }, deps);
}
