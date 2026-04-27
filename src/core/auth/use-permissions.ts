import { useAuth } from "./auth-context";
import {
  MENU_ITEMS,
  UserRole,
  MenuItem,
  getEffectiveRoleFromSession,
} from "./roles";

export function usePermissions() {
  const { session } = useAuth();
  const role: UserRole | undefined = getEffectiveRoleFromSession(session);

  function getAvailableMenu(): MenuItem[] {
    if (!role) return [];
    return MENU_ITEMS.filter((item) => item.roles.includes(role));
  }

  function canAccess(path: string): boolean {
    if (!role) return false;
    return MENU_ITEMS.some(
      (item) => item.path === path && item.roles.includes(role),
    );
  }

  function canAccessPath(pathname: string): boolean {
    if (!role) {
      return false;
    }

    return MENU_ITEMS.some((item) => {
      if (!item.roles.includes(role)) {
        return false;
      }

      return pathname === item.path || pathname.startsWith(`${item.path}/`);
    });
  }

  return { getAvailableMenu, canAccess, canAccessPath, role };
}
