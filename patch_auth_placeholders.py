with open('src/components/AuthScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace('placeholder="Elena Rostova"', 'placeholder="Your Full Name"')
content = content.replace('placeholder="name@agency.com"', 'placeholder="your.email@example.com"')

with open('src/components/AuthScreen.tsx', 'w') as f:
    f.write(content)
