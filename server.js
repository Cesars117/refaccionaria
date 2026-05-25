const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) {
      require('fs').appendFileSync('startup-error.log', `${new Date().toISOString()} - Listen Error: ${err.message}\n`);
      throw err;
    }
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Fatal Error during app.prepare():', err);
  require('fs').appendFileSync('startup-error.log', `${new Date().toISOString()} - Fatal Error: ${err.stack}\n`);
  process.exit(1);
});

