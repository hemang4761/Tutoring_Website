"use client";

import { useMemo, useState } from "react";

const COLLEGE_RE = /college|consulting|essay|application/;

export function CourseCatalog({
  groups: source,
  collegeNote,
}: {
  groups: { label: string; courses: string[] }[];
  collegeNote: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const tokens = useMemo(() => q.split(/\s+/).filter(Boolean), [q]);

  const groups = source.map((g) => ({
    ...g,
    visible: g.courses.filter((course) => tokens.every((t) => course.toLowerCase().includes(t))),
  }));
  const showCollege = Boolean(collegeNote) && (!q || COLLEGE_RE.test(q) || tokens.every((t) => collegeNote.toLowerCase().includes(t)));
  const total = groups.reduce((n, g) => n + g.visible.length, 0) + (showCollege ? 1 : 0);

  return (
    <>
      <div className="expertise-search-wrap">
        <label htmlFor="expertise-search" className="visually-hidden">
          Search courses
        </label>
        <input
          type="search"
          id="expertise-search"
          className="expertise-search"
          placeholder="Search for a course (e.g., AP Calc AB, algebra, physics)…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="expertise-search-icon" aria-hidden="true" />
      </div>

      <p className="expertise-no-results" hidden={total > 0 || !q}>
        No courses match your search.
      </p>

      <div className={`expertise-browse${q ? " has-query is-searching" : ""}`}>
        {groups.map((g, gi) => (
          <div
            key={`${g.label}-${gi}`}
            className={`expertise-group${g.visible.length === 0 ? " is-hidden" : ""}`}
            data-subject={g.label}
          >
            <h4 className="expertise-subject-heading">{g.label}</h4>
            <ul className="course-list">
              {g.courses.map((course, i) => {
                const shown = g.visible.includes(course);
                return (
                  <li
                    key={`${course}-${i}`}
                    className={`course-item${shown ? "" : " is-hidden"}`}
                    data-subject={shown ? g.label : undefined}
                  >
                    {course}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div
          className={`expertise-group expertise-group--college${showCollege ? "" : " is-hidden"}`}
          data-subject="college"
        >
          <h4 className="expertise-subject-heading">College Consulting</h4>
          <p className="expertise-college-desc">{collegeNote}</p>
        </div>
      </div>
    </>
  );
}
