import re

with open('api/index.py', 'r') as f:
    content = f.read()

content = content.replace('pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY")', 'pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")')

with open('api/index.py', 'w') as f:
    f.write(content)
