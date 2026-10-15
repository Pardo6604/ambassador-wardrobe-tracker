import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Add imports
imports = """import tempfile
import base64
import os
from gradio_client import Client, handle_file
from .schemas import TryOnRequest
"""
content = content.replace("from .schemas import (", imports + "\nfrom .schemas import (")

# Add endpoint before get_outfits
endpoint = """
@app.post("/api/outfits/generate-tryon")
def generate_tryon(request: TryOnRequest, current_user: User = Depends(get_current_user)):
    try:
        # Create temp files for input images
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
            person_data = base64.b64decode(request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64)
            p_file.write(person_data)
            person_path = p_file.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
            garment_data = base64.b64decode(request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64)
            g_file.write(garment_data)
            garment_path = g_file.name

        # Initialize Hugging Face Gradio Client
        hf_token = os.environ.get("HF_TOKEN")
        client = Client("yisol/IDM-VTON", hf_token=hf_token)

        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garment=handle_file(garment_path),
            prompt=request.garment_description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )
        
        # result is a tuple where the first element is the output image path
        output_path = result[0]
        
        # Read the output image and convert back to Base64
        with open(output_path, "rb") as f:
            output_b64 = base64.b64encode(f.read()).decode("utf-8")
        
        # Clean up temp files
        os.remove(person_path)
        os.remove(garment_path)

        return {"result_image_base64": f"data:image/png;base64,{output_b64}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""

content = content.replace('@app.get("/api/outfits"', endpoint + '\n@app.get("/api/outfits"')

with open('api/index.py', 'w') as f:
    f.write(content)
