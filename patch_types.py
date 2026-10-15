with open('src/types/index.ts', 'r') as f:
    content = f.read()

old_prof = """  avatar_url?: string;
  bio?: string;
  tier?: string;"""

new_prof = """  avatar_url?: string;
  bio?: string;
  tryon_base_image?: string;
  tier?: string;"""

content = content.replace(old_prof, new_prof)

with open('src/types/index.ts', 'w') as f:
    f.write(content)
