import { readRuntimeJsonStore, writeRuntimeJsonStore } from "@/lib/runtimeStorage";
export type SnapClientConnection = {
  clientId: string; accessToken: string; refreshToken: string | null; connectedAt: string;
  accessTokenExpiresAt: string | null; selectedAdAccountId: string | null; selectedAdAccountName: string | null;
  organizationId: string | null; lastDiscoveryAt: string | null; lastDiscoveryError: string | null; lastError: string | null;
};
type State = { version: 1; updatedAt: string | null; connections: SnapClientConnection[] };
const KEY = "media-dashboard:snap-connections", FILE = "snap-connections.json";
const defaults = (): State => ({ version: 1, updatedAt: null, connections: [] });
async function readState() { const state = await readRuntimeJsonStore<Partial<State>>(KEY, FILE, defaults()); return { ...defaults(), ...state, connections: state.connections ?? [] } satisfies State; }
async function writeState(state: State) { state.updatedAt = new Date().toISOString(); await writeRuntimeJsonStore(KEY, FILE, state); }
export async function getSnapConnection(clientId: string) { return (await readState()).connections.find((item) => item.clientId === clientId) ?? null; }
export async function upsertSnapConnection(connection: SnapClientConnection) { const state = await readState(); await writeState({ ...state, connections: [connection, ...state.connections.filter((item) => item.clientId !== connection.clientId)] }); return connection; }
export async function clearSnapConnection(clientId: string) { const state = await readState(); await writeState({ ...state, connections: state.connections.filter((item) => item.clientId !== clientId) }); }
