with open('api/index.py', 'r') as f:
    content = f.read()

content = content.replace("    ItemResponse,\n", "")

with open('api/index.py', 'w') as f:
    f.write(content)
