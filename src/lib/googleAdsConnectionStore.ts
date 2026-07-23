import { readRuntimeJsonStore, writeRuntimeJsonStore } from "@/lib/runtimeStorage";

export type GoogleAdsClientConnection = {
  clientId: string;
  accessToken: string;
  refreshToken: string | null;
  connectedAt: string;
  accessTokenExpiresAt: string | null;
  selectedCustomerId: string | null;
  selectedCustomerName: string | null;
  loginCustomerId: string | null;
  lastDiscoveryAt: string | null;
  lastDiscoveryError: string | null;
  lastError: string | null;
};

type State = { version: 1; updatedAt: string | null; connections: GoogleAdsClientConnection[] };
const KEY = "media-dashboard:google-ads-connections";
const FILE = "google-ads-connections.json";
const defaults = (): State => ({ version: 1, updatedAt: null, connections: [] });

async function readState() {
  const state = await readRuntimeJsonStore<Partial<State>>(KEY, FILE, defaults());
  return { ...defaults(), ...state, connections: state.connections ?? [] } satisfies State;
}
async function writeState(state: State) {
  state.updatedAt = new Date().toISOString();
  await writeRuntimeJsonStore(KEY, FILE, state);
}
export async function getGoogleAdsConnection(clientId: string) {
  return (await readState()).connections.find((item) => item.clientId === clientId) ?? null;
}
export async function upsertGoogleAdsConnection(connection: GoogleAdsClientConnection) {
  const state = await readState();
  await writeState({ ...state, connections: [connection, ...state.connections.filter((item) => item.clientId !== connection.clientId)] });
  return connection;
}
export async function clearGoogleAdsConnection(clientId: string) {
  const state = await readState();
  await writeState({ ...state, connections: state.connections.filter((item) => item.clientId !== clientId) });
}
