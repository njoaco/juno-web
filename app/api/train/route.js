// app/api/train/route.js
import { spawn } from 'child_process';

// GET en lugar de POST, para abrir SSE con un EventSource
export async function GET(request) {
  // Obtenemos los parámetros de la query: ?assetType=...&symbol=...
  const { searchParams } = new URL(request.url);
  const assetType = searchParams.get('assetType') || 'crypto';
  const symbol = searchParams.get('symbol') || 'BTC';

  // Creamos un TransformStream para enviar datos al cliente conforme llegan
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Iniciamos el proceso con python -u (unbuffered)
  const args = ['-u', 'scripts/train_model.py', '--asset_type', assetType, '--symbol', symbol];
  const child = spawn('python', args);

  // Cuando haya datos en stdout, se los mandamos al cliente como un "evento SSE"
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const sseMessage = `data: ${text}\n\n`;
    writer.write(encoder.encode(sseMessage));
  });

  // Si hay datos en stderr (warnings, errores, etc.), los mandamos como event: error
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const sseMessage = `event: error\ndata: ${text}\n\n`;
    writer.write(encoder.encode(sseMessage));
  });

  // Al finalizar el proceso, enviamos un último evento "end" y cerramos el stream
  child.on('close', (code) => {
    const endMsg = `Proceso finalizado con código: ${code}`;
    const sseMessage = `event: end\ndata: ${endMsg}\n\n`;
    writer.write(encoder.encode(sseMessage));
    writer.close();
  });

  // Devolvemos la Response SSE con cabeceras apropiadas
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
