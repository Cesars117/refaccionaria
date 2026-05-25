const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'srv1718.hstgr.io',
      port: 65002,
      username: 'u428779198',
      privateKey: fs.readFileSync(path.join(process.env.USERPROFILE || '', '.ssh', 'id_rsa_radiamex'), 'utf8'),
    });

    console.log('--- ULTIMAS LINEAS DE CONSOLE.LOG ---');
    const consoleLog = await ssh.execCommand('tail -n 50 domains/sistem.radiamex.com/nodejs/console.log || true');
    console.log(consoleLog.stdout || 'Vacio');

    console.log('\n--- ULTIMAS LINEAS DE STDERR.LOG ---');
    const stderrLog = await ssh.execCommand('tail -n 50 domains/sistem.radiamex.com/nodejs/stderr.log || true');
    console.log(stderrLog.stdout || 'Vacio');

    await ssh.dispose();
  } catch (err) {
    console.error('Error fetching logs:', err);
  }
}

run();
