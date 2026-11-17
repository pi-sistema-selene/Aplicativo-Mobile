import { subscribeToDataChanges } from "@/services/realtimeService";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

export function useRealtimeRefresh(
  refresh: () => void,
  refreshOnFocus = true,
) {
  const refreshRef = useRef(refresh);
  const hasFocused = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let unsubscribe: (() => void) | undefined;

      if (refreshOnFocus) {
        if (hasFocused.current) {
          refreshRef.current();
        } else {
          hasFocused.current = true;
        }
      }

      subscribeToDataChanges(() => refreshRef.current())
        .then((cleanup) => {
          if (active) {
            unsubscribe = cleanup;
          } else {
            cleanup();
          }
        })
        .catch((error) => {
          console.error("Não foi possível assinar atualizações em tempo real:", error);
        });

      return () => {
        active = false;
        unsubscribe?.();
      };
    }, [refreshOnFocus]),
  );
}
