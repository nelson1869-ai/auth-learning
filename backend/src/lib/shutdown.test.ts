import { describe, it, expect, afterEach } from 'vitest';
import { createServer, request, Agent } from 'node:http';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { shutdown } from './shutdown.ts';

// Graceful shutdown (Day 85). Totoong HTTP server (hindi ang buong app), para makontrol kung kailan
// matatapos ang isang "mabagal" na request habang pinapatay ang server
let server: Server | undefined;
afterEach(() => {
  server?.closeAllConnections();
  server = undefined;
});

async function start(handler: (req: IncomingMessage, res: ServerResponse) => void): Promise<number> {
  server = createServer(handler);
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  return (server.address() as AddressInfo).port;
}

function get(port: number, agent?: Agent): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path: '/', agent }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode!, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

describe('graceful shutdown', () => {
  it('finishes the in-flight request, refuses new connections, THEN runs cleanup', async () => {
    const events: string[] = [];
    let release!: () => void;
    let entered!: () => void;
    const inHandler = new Promise<void>((r) => (entered = r));
    const port = await start((_req, res) => {
      entered();
      // "mabagal" na request: sasagot lang kapag pinakawalan ng test
      new Promise<void>((r) => (release = r)).then(() => {
        events.push('response');
        res.end('tapos');
      });
    });

    const inFlight = get(port);
    await inHandler;
    const done = shutdown(server!, { timeoutMs: 5_000, cleanup: [['db', async () => void events.push('cleanup')]] });

    // Bagong koneksyon: HINDI pinagsisilbihan. REFUSED o RESET, depende sa timing: kaagad pagkatapos ng close(), puwede pang
    // tanggapin ng kernel ang koneksyon bago tuluyang magsara ang port, tapos ni-reset (nahuli: pumalya ang test na REFUSED lang)
    const rejected = await get(port).then(
      () => 'nasagot',
      (err: NodeJS.ErrnoException) => err.code,
    );
    expect(['ECONNREFUSED', 'ECONNRESET']).toContain(rejected);
    expect(events).toEqual([]); // hindi pa tapos ang request → hindi pa isinasara ang database

    release();
    expect(await inFlight).toEqual({ status: 200, body: 'tapos' }); // HINDI naputol
    expect(await done).toBe(0);
    expect(events).toEqual(['response', 'cleanup']);
  });

  it('runs every cleanup step in order, even after one fails (and reports exit code 1)', async () => {
    await start((_req, res) => res.end());
    const ran: string[] = [];
    const code = await shutdown(server!, {
      timeoutMs: 5_000,
      cleanup: [
        ['background', async () => void ran.push('background')],
        ['metrics', async () => {
          ran.push('metrics');
          throw new Error('metrics stop failed');
        }],
        ['db', async () => void ran.push('db')], // dapat pa ring isara ang database
      ],
    });
    expect(ran).toEqual(['background', 'metrics', 'db']);
    expect(code).toBe(1);
  });

  it('gives up at the deadline: cuts a request that never finishes and exits 1', async () => {
    let entered!: () => void;
    const inHandler = new Promise<void>((r) => (entered = r));
    const port = await start(() => entered()); // hindi kailanman sumasagot
    const stuck = get(port);
    await inHandler;

    const started = Date.now();
    const code = await shutdown(server!, { timeoutMs: 300, cleanup: [] });
    expect(code).toBe(1);
    expect(Date.now() - started).toBeLessThan(1_500);
    await expect(stuck).rejects.toMatchObject({ code: 'ECONNRESET' }); // pinutol
  });

  it('does not wait for idle keep-alive connections (e.g. cloudflared) — shutdown is quick', async () => {
    const port = await start((_req, res) => res.end('ok'));
    const agent = new Agent({ keepAlive: true });
    expect((await get(port, agent)).status).toBe(200); // bukas pa ang koneksyon, walang ginagawa

    const started = Date.now();
    expect(await shutdown(server!, { timeoutMs: 5_000, cleanup: [] })).toBe(0);
    expect(Date.now() - started).toBeLessThan(1_000); // hindi hinintay ang 5s na keep-alive timeout
    agent.destroy();
  });
});
