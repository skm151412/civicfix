import React, { useCallback, useRef, useState } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeSrc, afterSrc }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    if (!rect.width) {
      return;
    }
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    setPosition(clamp(relativeX, 0, 100));
  }, []);

  const startDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    updatePosition(event.clientX);

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      updatePosition(pointerEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [updatePosition]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 5;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPosition((prev) => clamp(prev - step, 0, 100));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPosition((prev) => clamp(prev + step, 0, 100));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 aspect-video min-h-[220px]"
    >
      <img
        src={beforeSrc}
        alt="Before repair"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src={afterSrc}
          alt="After repair"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>
      <div className="absolute inset-y-0" style={{ left: `calc(${position}% - 1px)` }}>
        <div className="relative flex h-full items-center">
          <span className="w-0.5 h-full bg-white/60" aria-hidden />
          <button
            type="button"
            className="absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/40 bg-slate-900/80 text-white text-xs font-semibold shadow-lg"
            aria-label="Drag to compare before and after"
            onPointerDown={startDrag}
            onKeyDown={handleKeyDown}
          >
            ||
          </button>
        </div>
      </div>
      <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-slate-950/70 border border-white/10">
        Before
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-slate-950/70 border border-white/10">
        After
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
