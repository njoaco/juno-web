import { spawn } from 'child_process';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const assetType = searchParams.get('assetType') || 'crypto';
  const symbol = searchParams.get('symbol') || 'BTC';

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const args = ['-u', 'scripts/train_model.py', '--asset_type', assetType, '--symbol', symbol];
  const child = spawn('python', args);

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const sseMessage = `data: ${text}\n\n`;
    writer.write(encoder.encode(sseMessage));
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const sseMessage = `event: error\ndata: ${text}\n\n`;
    writer.write(encoder.encode(sseMessage));
  });

  // Agregamos listener para el evento 'exit' para capturar el código o la señal
  child.on('exit', (code, signal) => {
    let endMsg = '';
    if (code !== null) {
      endMsg = `Proceso finalizado con código: ${code}`;
    } else if (signal !== null) {
      endMsg = `Proceso finalizado debido a la señal: ${signal}`;
    } else {
      endMsg = `Proceso finalizado sin código de salida.`;
    }
    const sseMessage = `event: end\ndata: ${endMsg}\n\n`;
    writer.write(encoder.encode(sseMessage));
    writer.close();
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
