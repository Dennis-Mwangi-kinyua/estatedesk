import "server-only";
import { Client } from "pg";

type Subscriber = { change: (scope: string) => void; disconnected: () => void };

/** One dedicated LISTEN connection per active application process, shared by tabs. */
class LiveListener {
  private client: Client | null = null;
  private connecting: Promise<void> | null = null;
  private subscribers = new Set<Subscriber>();
  private idle: ReturnType<typeof setTimeout> | undefined;

  async subscribe(subscriber: Subscriber) {
    clearTimeout(this.idle);
    this.subscribers.add(subscriber);
    try { await this.connect(); }
    catch (error) { this.subscribers.delete(subscriber); throw error; }
    return () => {
      this.subscribers.delete(subscriber);
      if (!this.subscribers.size) this.idle = setTimeout(() => {
        if (this.subscribers.size) return;
        const client = this.client; this.client = null;
        void client?.end().catch(() => {});
      }, 5000);
    };
  }

  private async connect() {
    if (this.connecting) return this.connecting;
    if (this.client) return;
    this.connecting = (async () => {
      // Transaction poolers cannot retain LISTEN session state.
      const connectionString = process.env.REALTIME_DATABASE_URL || process.env.DIRECT_URL;
      if (!connectionString) throw new Error("Realtime direct connection is not configured");
      const client = new Client({ connectionString, connectionTimeoutMillis: 8000, query_timeout: 8000, keepAlive: true });
      this.client = client;
      const disconnect = () => {
        if (this.client !== client) return;
        this.client = null;
        for (const subscriber of this.subscribers) subscriber.disconnected();
        this.subscribers.clear();
        void client.end().catch(() => {});
      };
      client.on("error", disconnect);
      client.on("end", disconnect);
      client.on("notification", message => {
        if (message.channel !== "estatedesk_workspace" || !message.payload) return;
        for (const subscriber of this.subscribers) subscriber.change(message.payload);
      });
      try { await client.connect(); await client.query("LISTEN estatedesk_workspace"); }
      catch (error) { disconnect(); throw error; }
    })().finally(() => { this.connecting = null; });
    return this.connecting;
  }
}

const globals = globalThis as typeof globalThis & { estateDeskLiveListener?: LiveListener };
export const liveListener = globals.estateDeskLiveListener ??= new LiveListener();
