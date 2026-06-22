import type { AppUser } from '../types';

export function userDisplayName(user: AppUser | null): string {
  const name = user?.displayName?.trim();
  if (name) return name;

  const emailName = user?.email?.split('@')[0]?.trim();
  return emailName || 'Usuario';
}

export function sameUserName(left: string | undefined, right: string): boolean {
  return (left ?? '').trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}
