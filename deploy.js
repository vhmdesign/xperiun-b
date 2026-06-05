/* deploy.js — deploy local via SFTP (Node puro, sem rsync).
   Roda no PC do user direto: `npm run deploy`. Usa o IP local que tem
   acesso garantido ao SSH do Hostinger (CI estava sendo bloqueado).

   Lê credenciais de .env (gitignored). Exemplo em .env.example.

   Estratégia:
   1. Conecta via SFTP
   2. Lê estrutura local de dist/ed/
   3. Pra cada arquivo: compara mtime+size com remoto. Upload só se diferente
      (poor-man's rsync — sem delta-transfer mas evita re-upload completo)
   4. Remove arquivos órfãos no servidor (que não existem mais em dist/) */
import SftpClient from 'ssh2-sftp-client';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = path.join(__dirname, 'dist', 'ed');
const REMOTE_DIR = '/domains/xperiun.com/public_html/ed';

const REQUIRED_ENV = ['SSH_HOST', 'SSH_PORT', 'SSH_USER', 'SSH_PASSWORD'];
for (const k of REQUIRED_ENV) {
    if (!process.env[k]) {
        console.error(`✗ Falta ${k} no .env (copie de .env.example)`);
        process.exit(1);
    }
}

const sftp = new SftpClient();

async function walkLocal() {
    const files = await glob('**/*', { cwd: LOCAL_DIR, nodir: false, dot: true });
    const map = new Map();
    for (const rel of files) {
        const full = path.join(LOCAL_DIR, rel);
        const stat = await fs.stat(full);
        map.set(rel.replace(/\\/g, '/'), {
            isDir: stat.isDirectory(),
            size: stat.size,
            mtime: stat.mtime,
        });
    }
    return map;
}

async function walkRemote() {
    const map = new Map();
    async function recurse(remote) {
        let list;
        try { list = await sftp.list(remote); }
        catch (e) {
            if (e.code === 2) return; /* not found, ok */
            throw e;
        }
        for (const item of list) {
            const fullRemote = `${remote}/${item.name}`;
            const rel = fullRemote.slice(REMOTE_DIR.length + 1);
            map.set(rel, {
                isDir: item.type === 'd',
                size: item.size,
                mtime: new Date(item.modifyTime),
            });
            if (item.type === 'd') await recurse(fullRemote);
        }
    }
    await recurse(REMOTE_DIR);
    return map;
}

function shouldUpload(local, remote) {
    if (!remote) return true; /* new */
    if (local.isDir !== remote.isDir) return true;
    if (local.isDir) return false; /* dirs don't get "uploaded" — only created */
    if (local.size !== remote.size) return true;
    /* mtime tolerance de 2s — SFTP timestamps podem ter precision diferente */
    const diff = Math.abs(local.mtime - remote.mtime);
    return diff > 2000;
}

async function ensureRemoteDir(remote) {
    try {
        await sftp.mkdir(remote, true);
    } catch (e) {
        if (e.code !== 4) throw e; /* 4 = already exists */
    }
}

(async () => {
    const t0 = Date.now();
    console.log(`Conectando a ${process.env.SSH_USER}@${process.env.SSH_HOST}:${process.env.SSH_PORT}...`);

    try {
        await sftp.connect({
            host: process.env.SSH_HOST,
            port: parseInt(process.env.SSH_PORT, 10),
            username: process.env.SSH_USER,
            password: process.env.SSH_PASSWORD,
            readyTimeout: 30000,
        });

        console.log('Lendo estrutura local + remota...');
        const [local, remote] = await Promise.all([walkLocal(), walkRemote()]);
        console.log(`Local: ${local.size} entries, Remoto: ${remote.size} entries`);

        const toUpload = [];
        const toMkdir = [];
        const toDelete = [];

        for (const [rel, info] of local) {
            const r = remote.get(rel);
            if (info.isDir) {
                if (!r || !r.isDir) toMkdir.push(rel);
            } else {
                if (shouldUpload(info, r)) toUpload.push(rel);
            }
        }

        for (const [rel, info] of remote) {
            if (!local.has(rel)) toDelete.push({ rel, isDir: info.isDir });
        }

        console.log(`Plano: ${toMkdir.length} mkdir, ${toUpload.length} upload, ${toDelete.length} delete`);

        /* Criar dirs primeiro (em ordem alfabética = parent antes de child) */
        toMkdir.sort();
        for (const rel of toMkdir) {
            const remotePath = `${REMOTE_DIR}/${rel}`;
            await ensureRemoteDir(remotePath);
        }

        /* Upload files */
        let i = 0;
        for (const rel of toUpload) {
            i++;
            const localPath = path.join(LOCAL_DIR, rel);
            const remotePath = `${REMOTE_DIR}/${rel}`;
            /* Garante que dir pai existe */
            await ensureRemoteDir(path.posix.dirname(remotePath));
            try {
                await sftp.fastPut(localPath, remotePath);
                if (i % 10 === 0 || i === toUpload.length) {
                    console.log(`  uploaded ${i}/${toUpload.length}`);
                }
            } catch (e) {
                console.error(`  FAIL ${rel}: ${e.message}`);
                throw e;
            }
        }

        /* Delete orphans: files first (reverse order), then dirs (reverse) */
        const delFiles = toDelete.filter(x => !x.isDir);
        const delDirs = toDelete.filter(x => x.isDir).sort((a, b) => b.rel.localeCompare(a.rel));

        for (const { rel } of delFiles) {
            const remotePath = `${REMOTE_DIR}/${rel}`;
            try {
                await sftp.delete(remotePath);
            } catch (e) {
                console.warn(`  [warn] couldn't delete ${rel}: ${e.message}`);
            }
        }
        for (const { rel } of delDirs) {
            const remotePath = `${REMOTE_DIR}/${rel}`;
            try {
                await sftp.rmdir(remotePath);
            } catch (e) {
                console.warn(`  [warn] couldn't rmdir ${rel}: ${e.message}`);
            }
        }

        const dt = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`✓ Deploy completo em ${dt}s — ${toUpload.length} files uploaded, ${toDelete.length} orphans removed`);
    } catch (err) {
        console.error('✗ Deploy falhou:', err.message);
        process.exitCode = 1;
    } finally {
        await sftp.end();
    }
})();
