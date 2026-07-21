export const ACTIVE_CLIENT_STORAGE_KEY = "media-dashboard-active-client";
export const ACTIVE_CLIENT_CHANGE_EVENT = "media-dashboard-client-change";

export type ActiveClientChangeEvent = CustomEvent<{ clientId: string }>;

export function persistActiveClient(clientId: string) {
  window.localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, clientId);
  window.dispatchEvent(
    new CustomEvent(ACTIVE_CLIENT_CHANGE_EVENT, { detail: { clientId } })
  );
}
