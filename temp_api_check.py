import urllib.request

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/catalog/products/') as r:
        print('status', r.status)
        data = r.read(1024).decode('utf-8')
        print(data)
except Exception as e:
    print('error', repr(e))
