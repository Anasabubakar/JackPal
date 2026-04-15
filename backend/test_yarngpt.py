import urllib.request, json

req = urllib.request.Request(
    'https://uhumaghodavid--jackpal-yarngpt.modal.run',
    data=json.dumps({'text': 'How far! JackPal don get Nigerian voice. E don set!', 'voice': 'jude'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
print("Calling Modal YarnGPT... (first call ~45s cold start)")
with urllib.request.urlopen(req, timeout=300) as r:
    d = r.read()
open('yarngpt_modal_test.wav', 'wb').write(d)
print(f"OK — {len(d):,} bytes. Play: start yarngpt_modal_test.wav")
