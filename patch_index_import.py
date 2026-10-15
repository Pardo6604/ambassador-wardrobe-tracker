with open('api/index.py', 'r') as f:
    content = f.read()

content = content.replace("UserResponse\\n", "UserResponse\n")

with open('api/index.py', 'w') as f:
    f.write(content)
