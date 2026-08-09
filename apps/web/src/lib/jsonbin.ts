import { promises as fs } from 'fs'
import path from 'path'
import type { EventsStore, SparkEvent } from '@/types/events'
import { buildSeedStore } from '@/lib/eventsSeed'

const BIN_ID = () => process.env.JSONBIN_BIN_ID || ''
const API_KEY = () => process.env.JSONBIN_API_KEY || ''

const LOCAL_PATH = path.join(process.cwd(), 'data', 'events.json')

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

async function ensureLocalSeed(): Promise<EventsStore> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, 'utf8')
    return JSON.parse(raw) as EventsStore
  } catch {
    const payment =
      process.env.NEXT_PUBLIC_PAYMENT_ADDRESS_ARC ||
      '0x3EBFE71f47e9863A273315C0DeE6464099BcD448'
    const ledger =
      process.env.NEXT_PUBLIC_LEDGER_ADDRESS_ARC ||
      '0xaCe8B112D9bf82E0510d999D456576b73F9F12C8'
    const store = buildSeedStore({ paymentAddress: payment, ledgerAddress: ledger })
    await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true })
    await fs.writeFile(LOCAL_PATH, JSON.stringify(store, null, 2), 'utf8')
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
    if ('events' in data && Array.isArray((data as EventsStore).events)) {
      return data as EventsStore
    }
    if ('record' in data) return data.record
  }
  console.warn('[events] JSONBin read failed, using local:', lastErr)
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
  if (remote?.events?.length) return remote
  return ensureLocalSeed()
}

export async function writeEventsStore(store: EventsStore): Promise<EventsStore> {
  const payload: EventsStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  }
  await writeLocal(payload)
  const ok = await writeRemote(payload)
  if (!ok) {
    console.warn('[events] JSONBin write failed — saved locally only')
  }
  return payload
}

export function findEvent(store: EventsStore, id: string): SparkEvent | undefined {
  return store.events.find((e) => e.id === id && e.active)
}
