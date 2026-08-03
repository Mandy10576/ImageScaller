import sys
import torchvision.transforms.functional as F
sys.modules['torchvision.transforms.functional_tensor'] = F

import torch
import numpy as np
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

print("Loading RealESRGAN model...", flush=True)
model_path = 'RealESRGAN_x4plus.pth'
state_dict = torch.load(model_path, map_location=torch.device('cpu'))['params_ema']

model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
model.load_state_dict(state_dict, strict=True)

upsampler = RealESRGANer(
    scale=4,
    model_path=model_path,
    model=model,
    tile=200,
    tile_pad=10,
    pre_pad=0,
    half=False,
)

print("Loading image.jpg...", flush=True)
img = Image.open('image.jpg').convert('RGB')
img = np.array(img)

print(f"Enhancing image (original size: {img.shape[1]}x{img.shape[0]})...", flush=True)
output, _ = upsampler.enhance(img, outscale=2)

print(f"Saving output image (upscaled size: {output.shape[1]}x{output.shape[0]})...", flush=True)
output_img = Image.fromarray(output)
output_img.save('output.png')
print("Successfully generated output.png!", flush=True)