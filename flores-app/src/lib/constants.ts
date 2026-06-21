import type { Assignee } from '../types';

// The signed-in vendor. In the prototype this is fixed to María; once Auth is
// wired to real accounts, derive it from the authenticated user's profile.
export const CURRENT_USER: Assignee = 'María';
