import { spawn } from 'child_process';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const assetType = searchParams.get('assetType') || 'crypto';
  const symbol = searchParams.get('symbol') || 'BTC';
  const days = searchParams.get('days') || '1'; // String en la query, lo pasamos tal cual

  // Creamos un TransformStream para enviar SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Iniciamos el proceso con -u (unbuffered) para no retener la salida
  const args = [
    '-u',
    'scripts/prediction.py',
    '--asset_type', assetType,
    '--symbol', symbol,
    '--days', days
  ];
  const child = spawn('python', args);

  // Capturamos stdout y enviamos como data:
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const sseMessage = `data: ${text}\n\n`;
    writer.write(encoder.encode(sseMessage));
  });

  // Capturamos stderr y lo enviamos como "error"
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const sseMessage = `event: error\ndata: ${text}\n\n`;
    writer.write(encoder.encode(sseMessage));
  });

  // Cuando termina el proceso, mandamos un "end"
  child.on('close', (code) => {
    const endMsg = `Proceso finalizado con código: ${code}`;
    const sseMessage = `event: end\ndata: ${endMsg}\n\n`;
    writer.write(encoder.encode(sseMessage));
    writer.close();
  });

  // Devolvemos la response con cabeceras SSE
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
