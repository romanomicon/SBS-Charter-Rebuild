/* structureLogic.js
   Structural logic using a BUILDING MODEL:

   Segments  = foundation
   Sections  = walls
   Divisions = roof
*/

import { state } from "./state.js";
import { scheduleAutosave } from "./autosave.js";

/* =========================
   CREATION
========================= */

export function addSegment(parIndex, fromRecursion = false) {
  if (state.segments.some(s => s.paragraphIndexes.includes(parIndex))) return;

  state.segments.push({
    id: ++state.ids.segment,
    title: "",
    paragraphIndexes: [parIndex],
    sectionId: null
  });

  // Also create at first paragraph (index 0) if not already there
  if (!fromRecursion && parIndex !== 0) {
    addSegment(0, true);
  }

  if (!fromRecursion) scheduleAutosave();
}

export function addSection(parIndex, fromDivision = false, divisionId = null, fromRecursion = false) {
  if (state.sections.some(s => s.paragraphIndexes.includes(parIndex))) return;

  const sectionId = ++state.ids.section;

  state.sections.push({
    id: sectionId,
    title: "",
    paragraphIndexes: [parIndex],
    divisionId
  });

  // Ensure foundation exists
  let segment = state.segments.find(s =>
    s.paragraphIndexes.includes(parIndex)
  );

  if (!segment) {
    segment = {
      id: ++state.ids.segment,
      title: "",
      paragraphIndexes: [parIndex],
      sectionId
    };
    state.segments.push(segment);
  } else if (!segment.sectionId) {
    segment.sectionId = sectionId;
  }

  // Also create at first paragraph (index 0) if not already there
  if (!fromRecursion && parIndex !== 0) {
    addSection(0, fromDivision, divisionId, true);
  }

  if (!fromDivision && !fromRecursion) scheduleAutosave();
}

export function addDivision(parIndex, fromRecursion = false) {
  if (state.divisions.some(d => d.paragraphIndexes.includes(parIndex))) return;

  const divisionId = ++state.ids.division;

  state.divisions.push({
    id: divisionId,
    title: "",
    paragraphIndexes: [parIndex]
  });

  // A roof requires walls
  addSection(parIndex, true, divisionId, false);

  // Also create at first paragraph (index 0) if not already there
  if (!fromRecursion && parIndex !== 0) {
    addDivision(0, true);
  }

  if (!fromRecursion) scheduleAutosave();
}

/* =========================
   DELETION
========================= */

export function deleteSegment(id) {
  if (!state.segments.some(s => s.id === id)) return;

  state.segments = state.segments.filter(s => s.id !== id);

  cleanupSections();
  cleanupDivisions();

  scheduleAutosave();
}

export function deleteSection(id) {
  if (!state.sections.some(s => s.id === id)) return;

  state.sections = state.sections.filter(s => s.id !== id);

  cleanupDivisions();

  scheduleAutosave();
}

export function deleteDivision(id) {
  state.divisions = state.divisions.filter(d => d.id !== id);
  scheduleAutosave();
}

/* =========================
   CLEANUP HELPERS
========================= */

/**
 * A section is valid ONLY if at least one segment supports it.
 */
function sectionHasFoundation(section) {
  return state.segments.some(segment =>
    segment.sectionId === section.id ||
    segment.paragraphIndexes.some(p =>
      section.paragraphIndexes.includes(p)
    )
  );
}

/**
 * A division is valid ONLY if at least one section supports it.
 */
function divisionHasWalls(division) {
  return state.sections.some(section =>
    section.divisionId === division.id ||
    section.paragraphIndexes.some(p =>
      division.paragraphIndexes.includes(p)
    )
  );
}

/* =========================
   CLEANUP (BOTTOM-UP)
========================= */

function cleanupSections() {
  state.sections = state.sections.filter(section =>
    sectionHasFoundation(section)
  );
}

function cleanupDivisions() {
  state.divisions = state.divisions.filter(division =>
    divisionHasWalls(division)
  );
}
