import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as http from 'http';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../common/app';

export = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
        const reqUrl = req.url && url.parse(req.url, true);
        if (!reqUrl) {
            notFound(res);
        } else if (reqUrl.pathname === '/') {
            await indexHtml(res);
        } else {
            staticContent(reqUrl, res);
        }
    } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
};

function staticContent(reqUrl: url.UrlWithParsedQuery, res: http.ServerResponse): void {
    if (!reqUrl.pathname) {
        notFound(res);
        return;
    }
    const stream = fs.createReadStream(path.join(__dirname, '../../dist', reqUrl.pathname));
    stream.once('error', (e: Error) => {
        if (!('code' in e && e['code'] === 'ENOENT')) {
            console.error(e);
        }
        notFound(res);
    });
    stream.pipe(res);
}

function indexHtml(res: http.ServerResponse): void {
    res.end(`<!DOCTYPE html>
<html>
  <head><title>Stars Growth</title></head>
  <body>
    <div id="app">${renderToString(<App />)}</div>
    <script src="main.js"></script>
  </body>
</html>`);
}

function notFound(res: http.ServerResponse): void {
    res.statusCode = 404;
    res.end('Page not found!');
}
