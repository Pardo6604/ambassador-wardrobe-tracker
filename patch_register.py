with open('api/index.py', 'r') as f:
    content = f.read()

old_reg = """        name=user_in.name,
        handle=user_in.handle,
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        bio="Fashion Ambassador"
    )"""

new_reg = """        name=user_in.name,
        handle=user_in.handle,
        avatar_url=None,
        bio=None
    )"""

content = content.replace(old_reg, new_reg)

with open('api/index.py', 'w') as f:
    f.write(content)
