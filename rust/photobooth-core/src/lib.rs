pub mod filters;
pub mod masks;
pub mod pixels;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn is_wasm_ready() -> bool {
    true
}

#[wasm_bindgen]
pub fn wasm_process_image(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    brightness: f32,
    contrast: f32,
    saturation: f32,
    temperature: f32,
    sepia: f32,
    grayscale: bool,
    vignette: f32,
    grain: f32,
) {
    pixels::process_pixels(
        pixels,
        width,
        height,
        brightness,
        contrast,
        saturation,
        temperature,
        sepia,
        grayscale,
        vignette,
    );
    if grain > 0.0 {
        pixels::apply_grain(pixels, width, height, grain);
    }
}

#[wasm_bindgen]
pub fn wasm_apply_filter(pixels: &mut [u8], width: u32, height: u32, preset: &str) {
    filters::apply_preset(pixels, width, height, preset);
}

#[wasm_bindgen]
pub fn wasm_blend_mask(
    subject: &[u8],
    background: &[u8],
    mask: &[u8],
    output: &mut [u8],
    width: u32,
    height: u32,
) {
    masks::blend_mask(subject, background, mask, output, width, height);
}
