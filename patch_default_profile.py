with open('src/services/api.ts', 'r') as f:
    content = f.read()

default_old = """const DEFAULT_PROFILE: AmbassadorProfile = {
  id: 'usr-ambassador-01',
  name: 'Elena Rostova',
  email: 'elena.rostova@ambassador.pr',
  handle: '@elenarostova',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  bio: 'Fashion & Streetwear Ambassador | Stockholm & NYC',
  tier: 'VIP Partner Ambassador',
  member_since: 'March 2025',
};"""

default_new = """const DEFAULT_PROFILE: AmbassadorProfile = {
  id: '',
  name: 'New Ambassador',
  email: '',
  handle: '',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  bio: '',
  tier: 'New Member',
  member_since: new Date().toLocaleDateString(),
};"""

content = content.replace(default_old, default_new)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

