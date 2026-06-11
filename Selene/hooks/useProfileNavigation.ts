import { useCallback } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { isAdminRole } from "@/utils/role";

export function useProfileNavigation() {
  const router = useRouter();

  const goToProfile = useCallback(async () => {
    const role = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);
    router.push(
      isAdminRole(role) ? "/(admin)/profile-admin" : "/(tabs)/profile",
    );
  }, [router]);

  return { goToProfile };
}
