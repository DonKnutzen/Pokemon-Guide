"""Create a local 251-species atlas from the pinned PokeAPI Gold sprite set."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path
import urllib.request
from PIL import Image

COMMIT = '97a7832d307311c0e1c6ea9035308bf80cc94f81'
ROOT = f'https://raw.githubusercontent.com/PokeAPI/sprites/{COMMIT}/sprites/pokemon/versions/generation-ii/gold/transparent'

def fetch(number):
    with urllib.request.urlopen(f'{ROOT}/{number}.png', timeout=30) as response:
        image = Image.open(BytesIO(response.read())).convert('RGBA')
        image.load()
    if image.width > 56 or image.height > 56:
        raise ValueError(f'Unexpected sprite dimensions for {number}: {image.size}')
    return number, image

def save_palette(image, output):
    # Each half fits into an exact RGBA palette. Preserve every source pixel.
    colors = [color for count, color in image.getcolors(1000000)]
    if len(colors) > 256:
        raise ValueError('The exact sprite palette exceeds 256 colors')
    indices = {color: index for index, color in enumerate(colors)}
    indexed = Image.new('P', image.size)
    indexed.putdata([indices[pixel] for pixel in image.getdata()])
    indexed.putpalette([channel for color in colors for channel in color[:3]])
    indexed.info['transparency'] = bytes(color[3] for color in colors)
    indexed.save(output, optimize=True)
    if Image.open(output).convert('RGBA').tobytes() != image.tobytes():
        raise ValueError('Sprite pixels changed during atlas encoding')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', default='docs/assets')
    args = parser.parse_args()
    atlas = Image.new('RGBA', (56 * 16, 56 * 16))
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(fetch, number) for number in range(1, 252)]
        for index, result in enumerate(as_completed(futures), 1):
            number, image = result.result()
            col, row = (number - 1) % 16, (number - 1) // 16
            atlas.alpha_composite(image, (col * 56 + (56-image.width)//2, row * 56 + (56-image.height)//2))
            if index % 50 == 0:
                print(f'{index}/251 sprites downloaded', flush=True)
    folder = Path(args.directory)
    folder.mkdir(parents=True, exist_ok=True)
    for half in range(2):
        image = atlas.crop((0, half * 448, 896, (half + 1) * 448))
        output = folder / f'pokemon-sprites-{half + 1}.png'
        save_palette(image, output)
        print(f'Saved {output}: {output.stat().st_size} bytes', flush=True)

if __name__ == '__main__':
    main()
