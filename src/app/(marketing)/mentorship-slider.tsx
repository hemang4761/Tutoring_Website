"use client";

import { useEffect, useState } from "react";

export function MentorshipSlider({
  slides,
}: {
  slides: { title: string; body: string; theme: string }[];
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (paused || total < 2) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % total), 5000);
    return () => clearInterval(id);
  }, [paused, total]);

  if (!total) return null;

  return (
    <div className="mentorship-slider-section">
      <h3 className="mentorship-slider-title">Specialized Mentorship</h3>
      <div
        className="mentorship-slider-container"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          className="mentorship-slider-arrow mentorship-slider-arrow--prev"
          aria-label="Previous slide"
          onClick={() => setCurrent((c) => (c - 1 + total) % total)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="mentorship-slider-wrapper">
          <div className="mentorship-slider-track" style={{ transform: `translateX(${-current * 100}%)` }}>
            {slides.map((s, i) => (
              <div key={`${s.title}-${i}`} className={`mentorship-slide mentorship-slide--${s.theme}`}>
                <div className="mentorship-slide-content">
                  <h4>{s.title}</h4>
                  <p className="mentorship-slide-description">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          className="mentorship-slider-arrow mentorship-slider-arrow--next"
          aria-label="Next slide"
          onClick={() => setCurrent((c) => (c + 1) % total)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="mentorship-slider-dots">
          {slides.map((s, i) => (
            <button
              key={s.title}
              className={`mentorship-dot${i === current ? " active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
