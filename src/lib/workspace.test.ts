import { describe, expect, it } from 'vitest';
import { findDuplicateSnapshotEntries } from './browserAdapter';
import { buildWorkspaceSuggestions } from './suggestions';
import { migrateWorkspaceState } from './workspaceStorage';
import type { WorkspaceState } from './workspaceTypes';

describe('workspace storage', () => {
  it('returns a versioned empty state for first-time users', () => {
    const state = migrateWorkspaceState(undefined);

    expect(state.version).toBe(1);
    expect(state.workspaces).toEqual([]);
    expect(state.preferences.dismissedSuggestionKeys).toEqual([]);
  });

  it('keeps existing workspace data while filling missing preference fields', () => {
    const state = migrateWorkspaceState({
      version: 0,
      workspaces: [{ id: 'w1', name: 'Docs' }],
    });

    expect(state.version).toBe(1);
    expect(state.preferences.activeWorkspaceId).toBe('w1');
    expect(state.suggestionChoices).toEqual([]);
  });
});

describe('duplicate detection', () => {
  it('matches snapshot URLs after normalizing fragments and trailing slashes', () => {
    const duplicates = findDuplicateSnapshotEntries(
      [
        {
          id: 'entry',
          title: 'Docs',
          url: 'https://example.com/docs/#intro',
          index: 0,
        },
      ],
      [
        {
          id: 11,
          title: 'Docs',
          url: 'https://example.com/docs/',
          index: 0,
        },
      ],
    );

    expect(duplicates[0].existingTab?.id).toBe(11);
  });
});

describe('workspace suggestions', () => {
  it('uses local signals and dismissals to suppress repeated suggestions', () => {
    const baseState: WorkspaceState = {
      version: 1,
      workspaces: [
        {
          id: 'w1',
          name: 'Design',
          icon: 'D',
          color: '#2f6f6b',
          keywords: ['figma'],
          pinnedLinks: [
            {
              id: 'l1',
              title: 'Figma Project',
              url: 'https://figma.com/file/1',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      snapshots: [],
      suggestionChoices: [],
      preferences: {
        dismissedSuggestionKeys: [],
        acceptedSuggestionKeys: [],
      },
    };

    const tabs = [
      {
        id: 1,
        title: 'Figma Project',
        url: 'https://figma.com/file/2',
        index: 0,
      },
    ];

    const suggestions = buildWorkspaceSuggestions(baseState, tabs);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].reasons.length).toBeGreaterThan(0);

    const dismissedState = {
      ...baseState,
      preferences: {
        dismissedSuggestionKeys: [suggestions[0].id],
        acceptedSuggestionKeys: [],
      },
    };

    expect(buildWorkspaceSuggestions(dismissedState, tabs)).toHaveLength(0);
  });
});
