with open('api/index.py', 'r') as f:
    content = f.read()

reg_old = """        password_hash=hashed_password,
        name=user_in.name,
        handle=user_in.handle
    )"""

reg_new = """        password_hash=hashed_password,
        name=user_in.name,
        handle=user_in.handle,
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        bio="Fashion Ambassador"
    )"""

content = content.replace(reg_old, reg_new)

with open('api/index.py', 'w') as f:
    f.write(content)
