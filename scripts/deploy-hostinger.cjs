const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');
const ssh = new NodeSSH();

async function run() {
  console.log('🚀 Iniciando despliegue de deploy.zip en Hostinger...');
  
  try {
    await ssh.connect({
      host: 'srv1718.hstgr.io',
      port: 65002,
      username: 'u428779198',
      privateKey: fs.readFileSync(path.join(process.env.USERPROFILE || '', '.ssh', 'id_rsa_radiamex'), 'utf8'),
    });

    console.log('✅ Conexión SSH establecida con éxito.');

    const localFile = path.join(__dirname, '..', 'deploy.zip');
    const remoteDir = 'domains/sistem.radiamex.com/nodejs';
    const remoteFile = `${remoteDir}/deploy.zip`;

    console.log(`📤 Subiendo ${localFile} a ${remoteFile}...`);
    
    await ssh.putFile(localFile, remoteFile);
    console.log('✅ Archivo deploy.zip subido con éxito.');

    console.log('🧹 Limpiando y extrayendo en el servidor...');
    const cmd = `cd ${remoteDir} && unzip -o deploy.zip && rm deploy.zip && cp -n .env.production .env 2>/dev/null || true && mkdir -p tmp && touch tmp/restart.txt && pkill -f next-server || true && pkill -f "node server.js" || true`;
    console.log(`🏃 Ejecutando: ${cmd}`);
    const result = await ssh.execCommand(cmd);
    if (result.stderr) console.log(`   (Detalle): ${result.stderr}`);
    console.log(`   ${result.stdout || 'OK'}`);

    console.log('🏁 ¡DESPLIEGUE COMPLETADO Y SERVIDOR REINICIADO!');
    await ssh.dispose();
    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR DURANTE EL DESPLIEGUE:', err);
    process.exit(1);
  }
}

run();
