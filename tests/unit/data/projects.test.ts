import { describe, it, expect } from 'vitest';
import type { TFunction } from 'i18next';
import {
  getAcademicProjects,
  getPersonalProjects,
  getAllTags,
  filterAcademicProjects,
  filterPersonalProjects,
} from '@/data/projects';

// Minimal fake translator: echoes the key so we can assert wiring without i18n.
const fakeT = ((key: string) => `T:${key}`) as unknown as TFunction;

describe('projects data accessors', () => {
  it('getAcademicProjects returns every academic project with derived fields', () => {
    const projects = getAcademicProjects();
    expect(projects).toHaveLength(7);

    const sae401 = projects.find((p) => p.id === 'sae401');
    expect(sae401).toBeDefined();
    expect(sae401?.path).toBe('/projet-SAE401');
    // Without a translator, derived strings fall back to their keys and tags to tag keys.
    expect(sae401?.type).toBe('data.projects.academic.sae401.type');
    expect(sae401?.tags).toEqual(sae401?.tagKeys);
    expect((sae401?.technologies.length ?? 0)).toBeGreaterThan(0);
  });

  it('applies the translation function when provided', () => {
    const [p] = getAcademicProjects(fakeT);
    // fakeT echoes each key as `T:<key>`, so every resolved string is prefixed.
    // (The resolved AcademicProject type intentionally drops the *Key fields, so we
    // assert on the prefix / tag-key shape rather than reconstructing the keys.)
    expect(p.type.startsWith('T:')).toBe(true);
    expect(p.title.startsWith('T:')).toBe(true);
    expect(p.category.startsWith('T:')).toBe(true);
    expect(p.tags[0]).toMatch(/^T:data\.projects\.tags\./);
    // The resolved tags align 1:1 with the source tag keys.
    expect(p.tags).toHaveLength(p.tagKeys.length);
  });

  it('getPersonalProjects returns every personal project', () => {
    const projects = getPersonalProjects();
    expect(projects).toHaveLength(3);
    expect(projects.map((p) => p.id)).toContain('discord-bot');
  });

  it('getAllTags returns a sorted, unique union of academic + personal tags', () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(new Set(tags).size).toBe(tags.length); // unique
    expect([...tags].sort()).toEqual(tags); // sorted
    expect(tags).toContain('java'); // from academic
    expect(tags).toContain('art'); // from personal
  });
});

describe('project filtering (AND semantics)', () => {
  it('returns all projects when no tags are selected', () => {
    expect(filterAcademicProjects([])).toHaveLength(7);
    expect(filterPersonalProjects([])).toHaveLength(3);
  });

  it('filters academic projects by a single tag', () => {
    const java = filterAcademicProjects(['java']);
    expect(java.length).toBeGreaterThan(0);
    expect(java.every((p) => p.tags.includes('java'))).toBe(true);
    expect(java.map((p) => p.id).sort()).toEqual(['megasae', 'sae12', 'sae401'].sort());
  });

  it('requires ALL selected tags to match', () => {
    expect(filterAcademicProjects(['java', 'docker']).map((p) => p.id)).toEqual(['sae401']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterAcademicProjects(['nope'])).toEqual([]);
    expect(filterPersonalProjects(['nope'])).toEqual([]);
  });

  it('filters personal projects by tag', () => {
    expect(filterPersonalProjects(['art']).map((p) => p.id)).toEqual(['drawings']);
  });
});
