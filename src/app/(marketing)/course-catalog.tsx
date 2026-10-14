"use client";

import { useMemo, useState } from "react";
import { CATALOG } from "@/lib/catalog";

const COLLEGE_RE = /college|consulting|essay|application/;

export function CourseCatalog() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const tokens = useMemo(() => q.split(/\s+/).filter(Boolean), [q]);

  // specialized courses are shown in the mentorship slider, not the catalog list
  const groups = CATALOG.filter((g) => g.key !== "specialized").map((g) => ({
    ...g,
    visible: g.courses.filter((course) => tokens.every((t) => course.search.includes(t))),
  }));
  const showCollege = !q || COLLEGE_RE.test(q);
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
        {groups.map((g) => (
          <div
            key={g.key}
            className={`expertise-group${g.visible.length === 0 ? " is-hidden" : ""}`}
            data-subject={g.key}
          >
            <h4 className="expertise-subject-heading">{g.label}</h4>
            <ul className="course-list">
              {g.courses.map((course) => {
                const shown = g.visible.includes(course);
                return (
                  <li
                    key={course.name}
                    className={`course-item${shown ? "" : " is-hidden"}`}
                    data-subject={shown ? g.label : undefined}
                  >
                    {course.name}
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
          <p className="expertise-college-desc">
            One-on-one support to build a strong application: narrative strategy, essay drafting and
            revision, and list-building.
          </p>
        </div>
      </div>
    </>
  );
}
