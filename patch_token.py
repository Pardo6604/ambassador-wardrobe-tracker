with open('api/index.py', 'r') as f:
    content = f.read()

content = content.replace('client = Client("yisol/IDM-VTON", hf_token=hf_token)', 'client = Client("yisol/IDM-VTON", token=hf_token)')

with open('api/index.py', 'w') as f:
    f.write(content)
