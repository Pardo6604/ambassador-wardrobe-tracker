import re

with open('src/services/api.ts', 'r') as f:
    content = f.read()

content = content.replace("if (Array.isArray(data) && data.length > 0) {", "if (Array.isArray(data)) {")

with open('src/services/api.ts', 'w') as f:
    f.write(content)
