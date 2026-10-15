import re

with open('api/index.py', 'r') as f:
    content = f.read()

old_except = """    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""

new_except = """    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))"""

content = content.replace(old_except, new_except)

with open('api/index.py', 'w') as f:
    f.write(content)
