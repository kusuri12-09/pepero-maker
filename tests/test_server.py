import io
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
from PIL import Image
import server

class ShareTests(unittest.TestCase):
 def test_upload_metadata_and_validation(self):
  with tempfile.TemporaryDirectory() as directory:
   original = server.DATA
   server.DATA = Path(directory)
   httpd = ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
   threading.Thread(target=httpd.serve_forever, daemon=True).start()
   origin = 'http://127.0.0.1:' + str(httpd.server_port)
   try:
    image = io.BytesIO(); Image.new('RGB', (1200,630)).save(image,format='PNG')
    request = Request(origin+'/api/shares',data=image.getvalue(),headers={'Content-Type':'image/png'})
    with urlopen(request) as response:
     self.assertEqual(response.status,201); path=json.load(response)['url']
    with urlopen(origin+path) as response:
     page=response.read().decode(); self.assertIn('property="og:image"',page); self.assertIn(path+'/image.png',page)
    with urlopen(origin+path+'/image.png') as response:
     self.assertEqual(Image.open(io.BytesIO(response.read())).size,(1200,630))
    for path,data,headers,code in [('/api/shares',b'invalid',{'Content-Type':'image/png'},400),('/api/shares',b'bad',{'Content-Type':'text/plain'},415),('/api/shares',image.getvalue(),{'Content-Type':'image/png','Origin':'https://evil.example'},403)]:
     with self.assertRaises(HTTPError) as error: urlopen(Request(origin+path,data=data,headers=headers))
     self.assertEqual(error.exception.code,code)
    for path in ['/.git/config','/.data/shares','/server.py','/share/'+'0'*32]:
     with self.assertRaises(HTTPError) as error: urlopen(origin+path)
     self.assertEqual(error.exception.code,404)
   finally:
    httpd.shutdown();httpd.server_close();server.DATA=original

if __name__ == '__main__': unittest.main()
