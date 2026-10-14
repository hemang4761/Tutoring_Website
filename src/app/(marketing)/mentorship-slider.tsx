"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    cls: "mentorship-slide--exam",
    title: "BCA Entrance Exam Prep",
    body: "Expert preparation for Bergen County Academies / Bergen Tech entrance exams with proven strategies and comprehensive practice.",
  },
  {
    cls: "mentorship-slide--math",
    title: "Competition Math",
    body: "Advanced problem-solving techniques and competition strategies for AMC, AIME, and other prestigious math competitions.",
  },
  {
    cls: "mentorship-slide--engineering",
    title: "Engineering Education",
    body: "Hands-on engineering mentorship covering advanced concepts, projects, and real-world applications beyond standard curriculum.",
  },
];

export function MentorshipSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = SLIDES.length;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % total), 5000);
    return () => clearInterval(id);
  }, [paused, total]);

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
            {SLIDES.map((s) => (
              <div key={s.title} className={`mentorship-slide ${s.cls}`}>
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
          {SLIDES.map((s, i) => (
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
