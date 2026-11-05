// Initial snapshots establish a baseline, even when that baseline is empty.
// Reactions, filtering and reconnects must not turn old voices into new arrivals.
export function createArrivalTracker() {
  const seen = new Set();
  let ready = false;
  return {
    update(items) {
      const arrived = ready ? items.filter(item => !seen.has(item.id) && !item.hidden).map(item => item.id) : [];
      items.forEach(item => seen.add(item.id));
      ready = true;
      return arrived;
    }
  };
}

export const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function captureLayout(root) {
  return new Map([...root.querySelectorAll('[data-motion-key]')].map(node => [node.dataset.motionKey, node.getBoundingClientRect()]));
}

export function animateArrivals(root, previous, ids) {
  if (!ids.length || reducedMotion()) return;
  const incoming = new Set(ids);
  root.querySelectorAll('.voice-card').forEach(node => {
    if (incoming.has(node.dataset.voiceId)) {
      node.animate([
        { opacity: 0, transform: 'translateY(-35px) scale(.94)' },
        { opacity: 1, transform: 'translateY(3px) scale(1.015)', offset: .72 },
        { opacity: 1, transform: 'none' }
      ], { duration: 1100, easing: 'cubic-bezier(.2,.7,.2,1)' });
    } else {
      const before = previous.get(node.dataset.motionKey), after = node.getBoundingClientRect();
      if (before && (Math.abs(before.x-after.x)>1 || Math.abs(before.y-after.y)>1)) {
        node.animate([
          { transform: `translate(${before.x-after.x}px,${before.y-after.y}px)` },
          { transform: 'none' }
        ], { duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    }
  });
}
