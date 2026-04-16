import urllib.request
import urllib.error
import json

urls = [
    'http://127.0.0.1:8000/api/catalog/products/',
    'http://127.0.0.1:8000/api/catalog/categories/',
    'http://127.0.0.1:8000/api/cart/wishlist/view/',
    'http://127.0.0.1:8000/api/users/profile/'
]

for url in urls:
    print('REQUEST', url)
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode('utf-8')
            print('STATUS', resp.status)
            print('LENGTH', len(data))
            try:
                js = json.loads(data)
                print('JSON KEYS', list(js.keys()) if isinstance(js, dict) else type(js).__name__)
            except Exception as e:
                print('NOT JSON', e)
    except urllib.error.HTTPError as e:
        print('HTTP ERROR', e.code, e.reason)
        print(e.read().decode('utf-8', errors='replace'))
    except Exception as e:
        print('ERROR', e)
    print('-' * 60)
