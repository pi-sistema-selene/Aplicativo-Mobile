import { API_BASE_URL } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import * as SecureStore from "expo-secure-store";
import { io, type Socket } from "socket.io-client";

type DataChangedListener = () => void;

const listeners = new Set<DataChangedListener>();
let socket: Socket | null = null;
let socketToken: string | null = null;
let lastConnectionError: string | null = null;

async function connect(token: string): Promise<void> {
  if (socket && socketToken === token) {
    if (!socket.connected) socket.connect();
    return;
  }

  socket?.disconnect();
  socketToken = token;
  socket = io(API_BASE_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on("data:changed", () => {
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        console.error("Erro ao atualizar dados em tempo real:", error);
      }
    }
  });
  socket.on("connect_error", (error) => {
    if (lastConnectionError !== error.message) {
      console.error("Falha na conexão em tempo real:", error.message);
      lastConnectionError = error.message;
    }
  });
  socket.on("connect", () => {
    lastConnectionError = null;
  });
}

export async function subscribeToDataChanges(
  listener: DataChangedListener,
): Promise<() => void> {
  listeners.add(listener);

  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
    if (token) {
      await connect(token);
    }
  } catch (error) {
    listeners.delete(listener);
    throw error;
  }

  return () => {
    listeners.delete(listener);
  };
}
