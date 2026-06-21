/**
 * deploy.mjs — Sube archivos modificados a Hostinger por FTP
 * Uso: node deploy.mjs
 */
import { execSync } from 'child_process';
import { createReadStream, statSync } from 'fs';
import { basename, dirname } from 'path';
import net from 'net';
import tls from 'tls';

// ── Configuracion ─────────────────────────────────────────────
const FTP_HOST = process.env.FTP_SERVER   || '157.173.208.249';
const FTP_USER = process.env.FTP_USERNAME || '';
const FTP_PASS = process.env.FTP_PASSWORD || '';
const REMOTE_ROOT = '/wp-content/';
const LOCAL_ROOT  = 'wp-content/';

if (!FTP_USER || !FTP_PASS) {
  console.error('❌ Define FTP_USERNAME y FTP_PASSWORD como variables de entorno.');
  console.error('   Ejemplo: $env:FTP_USERNAME="u123456"; $env:FTP_PASSWORD="pass"; node deploy.mjs');
  process.exit(1);
}

// ── Obtener archivos modificados ──────────────────────────────
let files;
try {
  const diff = execSync('git diff HEAD~1 HEAD --name-only --diff-filter=ACM', { encoding: 'utf8' });
  files = diff.trim().split('\n').filter(f => f.startsWith('wp-content/'));
} catch {
  console.error('❌ Error ejecutando git diff');
  process.exit(1);
}

if (files.length === 0 || (files.length === 1 && files[0] === '')) {
  console.log('✅ Sin cambios en wp-content/, nada que subir.');
  process.exit(0);
}

console.log('📦 Archivos a subir:');
files.forEach(f => console.log('  -', f));

// ── Cliente FTP simple ────────────────────────────────────────
class FTPClient {
  constructor() { this.socket = null; this.buffer = ''; }

  connect(host, port = 21) {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(port, host);
      this.socket.setEncoding('utf8');
      this.socket.on('data', d => { this.buffer += d; });
      this.socket.on('error', reject);
      this.waitFor(/^220/m).then(resolve).catch(reject);
    });
  }

  waitFor(pattern, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('FTP timeout waiting for ' + pattern)), timeout);
      const check = () => {
        const match = this.buffer.match(pattern);
        if (match) {
          clearTimeout(timer);
          this.buffer = this.buffer.slice(this.buffer.indexOf(match[0]) + match[0].length);
          resolve(match[0]);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  async send(cmd, expectPattern = /^\d{3} /m) {
    this.socket.write(cmd + '\r\n');
    return this.waitFor(expectPattern);
  }

  async uploadFile(localPath, remotePath) {
    // Modo pasivo
    const pasvResp = await this.send('PASV', /^227/m);
    const match = pasvResp.match(/(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/);
    if (!match) throw new Error('PASV parse error');
    const dataHost = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    const dataPort = parseInt(match[5]) * 256 + parseInt(match[6]);

    return new Promise((resolve, reject) => {
      const dataSocket = net.createConnection(dataPort, dataHost, async () => {
        this.socket.write(`STOR ${remotePath}\r\n`);
        await this.waitFor(/^150/m);
        const stream = createReadStream(localPath);
        stream.pipe(dataSocket);
        stream.on('end', () => dataSocket.end());
        dataSocket.on('close', async () => {
          await this.waitFor(/^226/m);
          resolve();
        });
        dataSocket.on('error', reject);
      });
      dataSocket.on('error', reject);
    });
  }

  async quit() {
    try { await this.send('QUIT', /^221/m); } catch {}
    this.socket.destroy();
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const ftp = new FTPClient();
  try {
    console.log(`\n🔌 Conectando a ${FTP_HOST}:21...`);
    await ftp.connect(FTP_HOST, 21);
    await ftp.send(`USER ${FTP_USER}`, /^331/m);
    await ftp.send(`PASS ${FTP_PASS}`, /^230/m);
    await ftp.send('TYPE I', /^200/m);
    console.log('✅ Conectado\n');

    for (const file of files) {
      if (!file) continue;
      const remotePath = file; // El servidor FTP inicia en /public_html
      console.log(`⬆️  Subiendo: ${file}`);
      try {
        await ftp.uploadFile(file, remotePath);
        console.log(`✅ OK: ${file}`);
      } catch (err) {
        console.error(`❌ Error subiendo ${file}:`, err.message);
      }
    }

    await ftp.quit();
    console.log('\n🎉 Deploy completado.');
  } catch (err) {
    console.error('❌ Error FTP:', err.message);
    await ftp.quit().catch(() => {});
    process.exit(1);
  }
}

main();
