"""Local Pepero server: static files and image-specific Open Graph links."""
import html
import io
import json
import os
from pathlib import Path
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from uuid import uuid4
from PIL import Image, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent
DATA = ROOT / '.data' / 'shares'
MAX_UPLOAD = 4 * 1024 * 1024

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def respond(self, status, body, content_type):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/api/shares':
            self.send_error(404)
            return
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'):
            self.send_error(403)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            length = 0
        if not 0 < length <= MAX_UPLOAD:
            self.send_error(413)
            return
        if self.headers.get_content_type() != 'image/png':
            self.send_error(415)
            return
        raw = self.rfile.read(length)
        try:
            with Image.open(io.BytesIO(raw)) as image:
                if image.format != 'PNG' or image.size != (1200, 630):
                    raise ValueError('Invalid card')
                image.verify()
            with Image.open(io.BytesIO(raw)) as image:
                output = io.BytesIO()
                image.convert('RGB').save(output, format='PNG')
        except (UnidentifiedImageError, ValueError, OSError, SyntaxError):
            self.send_error(400)
            return
        DATA.mkdir(parents=True, exist_ok=True)
        name = uuid4().hex
        (DATA / (name + '.png')).write_bytes(output.getvalue())
        self.respond(201, json.dumps({'url': '/share/' + name}).encode(), 'application/json')

    def do_GET(self):
        path = urlsplit(self.path).path
        match = re.fullmatch(r'/share/([a-f0-9]{32})(/image.png)?', path)
        if match:
            name, image_path = match.groups()
            file = DATA / (name + '.png')
            if not file.is_file():
                self.send_error(404)
                return
            if image_path:
                self.respond(200, file.read_bytes(), 'image/png')
                return
            origin = os.environ.get('PUBLIC_URL', 'http://localhost:4173').rstrip('/')
            image_url = html.escape(origin + '/share/' + name + '/image.png', quote=True)
            share_url = html.escape(origin + '/share/' + name, quote=True)
            page = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>나만의 빼빼로 만들기</title><meta property="og:type" content="website">
<meta property="og:title" content="나만의 빼빼로 메이커">
<meta property="og:image" content="{image_url}"><meta property="og:url" content="{share_url}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{image_url}">
<script>location.replace('/');</script></head><body><a href="/">나도 만들어보기</a></body></html>'''
            self.respond(200, page.encode(), 'text/html; charset=utf-8')
            return
        resolved = Path(self.translate_path(self.path)).resolve()
        allowed = resolved in (ROOT / 'index.html', ROOT / 'app.js') or resolved.is_relative_to(ROOT / 'public')
        if path == '/':
            self.path = '/index.html'
        elif not allowed or not resolved.is_file():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

if __name__ == '__main__':
    print('Pepero: http://localhost:4173/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4173), Handler).serve_forever()
