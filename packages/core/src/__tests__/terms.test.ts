import { describe, expect, it } from 'vitest';

import {
  ancestorTerms,
  buildTermTree,
  childTerms,
  descendantTermIds,
  flattenTermTree,
  termsWithPosts,
} from '../terms';
import type { TermRow } from '../database.types';

function term(id: string, name: string, parent_id: string | null = null): TermRow {
  return {
    id,
    site_id: 'site-1',
    kind: 'category',
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description: null,
    parent_id,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

//        Energy            Finance
//        /     \              |
//    Solar     Wind        Loans
//      |
//   Panels
const TREE = [
  term('energy', 'Energy'),
  term('solar', 'Solar', 'energy'),
  term('wind', 'Wind', 'energy'),
  term('panels', 'Panels', 'solar'),
  term('finance', 'Finance'),
  term('loans', 'Loans', 'finance'),
];

describe('buildTermTree', () => {
  it('nests children under parents and sorts each level by name', () => {
    const roots = buildTermTree(TREE);

    expect(roots.map((n) => n.term.name)).toEqual(['Energy', 'Finance']);

    const energy = roots.find((n) => n.term.id === 'energy');
    expect(energy?.depth).toBe(0);
    expect(energy?.children.map((n) => n.term.name)).toEqual(['Solar', 'Wind']);

    const solar = energy?.children.find((n) => n.term.id === 'solar');
    expect(solar?.depth).toBe(1);
    expect(solar?.children.map((n) => n.term.name)).toEqual(['Panels']);
    expect(solar?.children[0]?.depth).toBe(2);
  });

  it('keeps a term whose parent is missing from the list, as a root', () => {
    // parent_id is `on delete set null`, so this is not a normal state — but
    // filtering the list (empty categories, say) must not silently drop a whole
    // subtree along with the parent that was filtered out.
    const orphaned = [term('solar', 'Solar', 'energy'), term('panels', 'Panels', 'solar')];
    const roots = buildTermTree(orphaned);

    expect(roots.map((n) => n.term.name)).toEqual(['Solar']);
    expect(roots[0]?.children.map((n) => n.term.name)).toEqual(['Panels']);
  });

  it('returns an empty tree for an empty list', () => {
    expect(buildTermTree([])).toEqual([]);
  });
});

describe('flattenTermTree', () => {
  it('returns parents immediately followed by their children, with depths', () => {
    expect(flattenTermTree(TREE).map((f) => `${'  '.repeat(f.depth)}${f.term.name}`)).toEqual([
      'Energy',
      '  Solar',
      '    Panels',
      '  Wind',
      'Finance',
      '  Loans',
    ]);
  });

  it('includes every term exactly once', () => {
    const flat = flattenTermTree(TREE);
    expect(flat).toHaveLength(TREE.length);
    expect(new Set(flat.map((f) => f.term.id)).size).toBe(TREE.length);
  });
});

describe('descendantTermIds', () => {
  it('includes the root and every level below it', () => {
    expect(new Set(descendantTermIds(TREE, 'energy'))).toEqual(
      new Set(['energy', 'solar', 'wind', 'panels']),
    );
  });

  it('includes a grandchild, not just direct children', () => {
    expect(descendantTermIds(TREE, 'solar')).toContain('panels');
  });

  it('returns just the term itself for a leaf', () => {
    expect(descendantTermIds(TREE, 'panels')).toEqual(['panels']);
  });

  it('does not cross into a sibling subtree', () => {
    expect(descendantTermIds(TREE, 'energy')).not.toContain('finance');
    expect(descendantTermIds(TREE, 'energy')).not.toContain('loans');
  });
});

describe('ancestorTerms', () => {
  it('returns ancestors nearest-first', () => {
    expect(ancestorTerms(TREE, 'panels').map((t) => t.name)).toEqual(['Solar', 'Energy']);
  });

  it('returns nothing for a root', () => {
    expect(ancestorTerms(TREE, 'energy')).toEqual([]);
  });
});

describe('childTerms', () => {
  it('returns direct children only, sorted', () => {
    expect(childTerms(TREE, 'energy').map((t) => t.name)).toEqual(['Solar', 'Wind']);
    expect(childTerms(TREE, 'energy').map((t) => t.name)).not.toContain('Panels');
  });
});

/*
 * The database rejects cycles as of migration 0005, but rows written before it
 * were never checked. A hang is a much worse failure than a dropped edge, so
 * every walk is guarded — and the guard is worth pinning, because it is
 * invisible when the data is well-formed.
 */
describe('cycle safety on pre-0005 data', () => {
  const cyclic = [
    term('a', 'A', 'c'),
    term('b', 'B', 'a'),
    term('c', 'C', 'b'),
    term('clean', 'Clean'),
  ];

  it('buildTermTree terminates and still surfaces well-formed roots', () => {
    const roots = buildTermTree(cyclic);
    expect(roots.map((n) => n.term.name)).toContain('Clean');
  });

  it('flattenTermTree terminates without repeating a term', () => {
    const flat = flattenTermTree(cyclic);
    expect(new Set(flat.map((f) => f.term.id)).size).toBe(flat.length);
  });

  it('descendantTermIds terminates and does not repeat', () => {
    const ids = descendantTermIds(cyclic, 'a');
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('a');
  });

  it('ancestorTerms terminates', () => {
    const ancestors = ancestorTerms(cyclic, 'a');
    expect(new Set(ancestors.map((t) => t.id)).size).toBe(ancestors.length);
  });
});

describe('termsWithPosts', () => {
  it('marks a parent whose posts live only in a child', () => {
    // The case that matters: editors tag "Panels", never "Energy", but
    // /blog/category/energy/ lists those posts because archives include
    // descendants. Treating Energy as empty would hide a page that has content.
    const withPosts = termsWithPosts(TREE, new Set(['panels']));

    expect(withPosts).toContain('panels');
    expect(withPosts).toContain('solar');
    expect(withPosts).toContain('energy');
  });

  it('does not mark an unrelated subtree', () => {
    const withPosts = termsWithPosts(TREE, new Set(['panels']));
    expect(withPosts).not.toContain('wind');
    expect(withPosts).not.toContain('finance');
    expect(withPosts).not.toContain('loans');
  });

  it('marks nothing when nothing is used', () => {
    expect(termsWithPosts(TREE, new Set())).toEqual(new Set());
  });

  it('marks a used root with no children', () => {
    expect(termsWithPosts(TREE, new Set(['finance']))).toEqual(new Set(['finance']));
  });
});
