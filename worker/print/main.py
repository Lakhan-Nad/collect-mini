import json
import os

s = input()
data = json.loads(s)

print(json.dumps(data, indent=True))
