import { promises as fs } from 'fs'
import path from 'path'
import type { AgentPassRecord, EventsStore, SparkEvent } from '@/types/events'
import { buildSeedStore } from '@/lib/eventsSeed'

const BIN_ID = () => process.env.JSONBIN_BIN_ID || ''
const API_KEY = () => process.env.JSONBIN_API_KEY || ''

/** Vercel / Lambda: app dir is read-only (EROFS). Only /tmp is writable. */
function isServerlessReadonlyFs() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

const LOCAL_PATH = isServerlessReadonlyFs()
  ? path.join('/tmp', 'sparkgas-events.json')
  : path.join(process.cwd(), 'data', 'events.json')

function authHeaders(json = true): HeadersInit[] {
  const key = API_KEY()
  const variants: HeadersInit[] = [
    {
      'X-Master-Key': key,
      'X-Bin-Meta': 'false',
      ...(json ? { 'Content-Type': 'application/json' } : {}),
    },
    {
      'X-Access-Key': key,
      'X-Bin-Meta': 'false',
      ...(json ? { 'Content-Type': 'application/json' } : {}),
    },
  ]
  return variants
}

export function jsonbinConfigured() {
  return Boolean(BIN_ID() && API_KEY())
}

function seedStore(): EventsStore {
  const payment =
    process.env.NEXT_PUBLIC_PAYMENT_ADDRESS_ARC ||
    '0x3EBFE71f47e9863A273315C0DeE6464099BcD448'
  const ledger =
    process.env.NEXT_PUBLIC_LEDGER_ADDRESS_ARC ||
    '0xaCe8B112D9bf82E0510d999D456576b73F9F12C8'
  const store = buildSeedStore({ paymentAddress: payment, ledgerAddress: ledger })
  store.passes = []
  return store
}

async function ensureLocalSeed(): Promise<EventsStore> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, 'utf8')
    const parsed = JSON.parse(raw) as EventsStore
    if (!Array.isArray(parsed.passes)) parsed.passes = []
    return parsed
  } catch {
    const store = seedStore()
    // Never block seed on EROFS — in-memory is fine for cold start fallback
    await writeLocal(store).catch(() => undefined)
    return store
  }
}

async function writeLocal(store: EventsStore) {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true })
  await fs.writeFile(LOCAL_PATH, JSON.stringify(store, null, 2), 'utf8')
}

async function readRemote(): Promise<EventsStore | null> {
  if (!jsonbinConfigured()) return null
  let lastErr = ''
  for (const headers of authHeaders(false)) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID()}/latest`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) {
      lastErr = `${res.status} ${(await res.text()).slice(0, 120)}`
      continue
    }
    const data = (await res.json()) as EventsStore | { record: EventsStore }
    let store: EventsStore | null = null
    if ('events' in data && Array.isArray((data as EventsStore).events)) {
      store = data as EventsStore
    } else if ('record' in data) {
      store = data.record
    }
    if (store) {
      if (!Array.isArray(store.passes)) store.passes = []
      return store
    }
  }
  console.warn('[events] JSONBin read failed, using local/seed:', lastErr)
  return null
}

async function writeRemote(store: EventsStore): Promise<boolean> {
  if (!jsonbinConfigured()) return false
  for (const headers of authHeaders(true)) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID()}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(store),
    })
    if (res.ok) return true
  }
  return false
}

export async function readEventsStore(): Promise<EventsStore> {
  const remote = await readRemote()
  if (remote?.events?.length) {
    if (!Array.isArray(remote.passes)) remote.passes = []
    return remote
  }
  // On Vercel, empty/missing bin → in-memory seed (don't require disk)
  if (isServerlessReadonlyFs()) return seedStore()
  return ensureLocalSeed()
}

export async function writeEventsStore(store: EventsStore): Promise<EventsStore> {
  const payload: EventsStore = {
    ...store,
    passes: store.passes || [],
    updatedAt: new Date().toISOString(),
  }

  // Local write is best-effort — fails with EROFS on Vercel app dir
  await writeLocal(payload).catch((err) => {
    if (!isServerlessReadonlyFs()) {
      console.warn('[events] local write failed:', err)
    }
  })

  if (isServerlessReadonlyFs() && !jsonbinConfigured()) {
    throw new Error(
      'JSONBIN_BIN_ID and JSONBIN_API_KEY must be set on Vercel — the server filesystem is read-only',
    )
  }

  const ok = await writeRemote(payload)
  if (!ok) {
    if (isServerlessReadonlyFs()) {
      throw new Error(
        'JSONBin write failed on production. Check JSONBIN_BIN_ID / JSONBIN_API_KEY (use Master Key for PUT).',
      )
    }
    console.warn('[events] JSONBin write failed — saved locally only')
  }
  return payload
}

export function findEvent(store: EventsStore, id: string): SparkEvent | undefined {
  return store.events.find((e) => e.id === id && e.active)
}

/** Persist an agent VIP purchase to local JSON + JSONBin */
export async function saveAgentPassRecord(pass: AgentPassRecord): Promise<EventsStore> {
  const store = await readEventsStore()
  const passes = store.passes || []
  const exists = passes.some((p) => p.txHash.toLowerCase() === pass.txHash.toLowerCase())
  if (!exists) {
    passes.unshift(pass)
    store.passes = passes.slice(0, 200)
  }
  return writeEventsStore(store)
}

export function listPassesForHolder(store: EventsStore, holder: string): AgentPassRecord[] {
  const h = holder.toLowerCase()
  return (store.passes || []).filter((p) => p.holder.toLowerCase() === h)
}
