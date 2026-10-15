with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

old_signin = """  const handleSignIn = (email: string) => {
    apiService.login(email);
    setIsLoggedIn(true);
    showToast(`Welcome back, ${profile.name}!`);
  };"""

new_signin = """  const handleSignIn = (email: string) => {
    setIsLoggedIn(true);
    // Profile will be re-fetched properly from loadData -> apiService.getProfile()
  };"""

content = content.replace(old_signin, new_signin)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
