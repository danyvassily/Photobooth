/// Fast clamp helper for 0..255 range
#[inline(always)]
fn clamp_u8(v: f32) -> u8 {
    if v <= 0.0 {
        0
    } else if v >= 255.0 {
        255
    } else {
        v as u8
    }
}

/// Applies brightness, contrast, saturation, temperature, sepia, grayscale, and vignette.
pub fn process_pixels(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    brightness: f32, // -100.0 to 100.0
    contrast: f32,   // -100.0 to 100.0
    saturation: f32, // -100.0 to 100.0
    temperature: f32,// -100.0 to 100.0
    sepia: f32,      // 0.0 to 100.0
    grayscale: bool,
    vignette: f32,   // 0.0 to 100.0
) {
    let num_pixels = (width * height) as usize;
    if pixels.len() < num_pixels * 4 {
        return;
    }

    // Precalculate factors
    let b_offset = brightness * 2.55;
    let c_factor = if contrast >= 0.0 {
        (100.0 + contrast) / 100.0
    } else {
        (100.0 + contrast) / 100.0
    };
    let s_factor = (100.0 + saturation) / 100.0;
    let t_shift = temperature * 0.4;
    let sepia_factor = (sepia / 100.0).clamp(0.0, 1.0);
    let vig_strength = (vignette / 100.0).clamp(0.0, 1.0);

    let center_x = width as f32 / 2.0;
    let center_y = height as f32 / 2.0;
    let max_dist_sq = (center_x * center_x + center_y * center_y).max(1.0);

    for y in 0..height {
        let dy = y as f32 - center_y;
        let dy_sq = dy * dy;
        let row_offset = (y * width * 4) as usize;

        for x in 0..width {
            let idx = row_offset + (x * 4) as usize;
            let mut r = pixels[idx] as f32;
            let mut g = pixels[idx + 1] as f32;
            let mut b = pixels[idx + 2] as f32;

            // 1. Brightness
            if brightness != 0.0 {
                r += b_offset;
                g += b_offset;
                b += b_offset;
            }

            // 2. Contrast
            if contrast != 0.0 {
                r = (r - 128.0) * c_factor + 128.0;
                g = (g - 128.0) * c_factor + 128.0;
                b = (b - 128.0) * c_factor + 128.0;
            }

            // 3. Temperature (cool = more blue/cyan, warm = more red/yellow)
            if temperature != 0.0 {
                r += t_shift;
                b -= t_shift;
            }

            // 4. Saturation or Grayscale
            let luma = 0.299 * r + 0.587 * g + 0.114 * b;
            if grayscale {
                r = luma;
                g = luma;
                b = luma;
            } else if saturation != 0.0 {
                r = luma + (r - luma) * s_factor;
                g = luma + (g - luma) * s_factor;
                b = luma + (b - luma) * s_factor;
            }

            // 5. Sepia
            if sepia_factor > 0.0 {
                let sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
                let sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
                let sb = (r * 0.272) + (g * 0.534) + (b * 0.131);
                r = r * (1.0 - sepia_factor) + sr * sepia_factor;
                g = g * (1.0 - sepia_factor) + sg * sepia_factor;
                b = b * (1.0 - sepia_factor) + sb * sepia_factor;
            }

            // 6. Vignette
            if vig_strength > 0.0 {
                let dx = x as f32 - center_x;
                let dist_sq = dx * dx + dy_sq;
                let vig = 1.0 - (dist_sq / max_dist_sq) * vig_strength;
                let vig_clamped = vig.clamp(0.0, 1.0);
                r *= vig_clamped;
                g *= vig_clamped;
                b *= vig_clamped;
            }

            pixels[idx] = clamp_u8(r);
            pixels[idx + 1] = clamp_u8(g);
            pixels[idx + 2] = clamp_u8(b);
            // Alpha (pixels[idx + 3]) untouched
        }
    }
}

/// Applies film grain using a linear congruential PRNG
pub fn apply_grain(pixels: &mut [u8], width: u32, height: u32, intensity: f32) {
    if intensity <= 0.0 {
        return;
    }
    let factor = (intensity / 100.0).clamp(0.0, 1.0) * 40.0;
    let mut state: u32 = 123456789;
    let total = (width * height * 4) as usize;

    for i in (0..total).step_by(4) {
        state = state.wrapping_mul(1664525).wrapping_add(1013904223);
        let rand_val = ((state >> 16) & 0xFF) as f32; // 0..255
        let noise = ((rand_val / 255.0) - 0.5) * factor;

        let r = pixels[i] as f32 + noise;
        let g = pixels[i + 1] as f32 + noise;
        let b = pixels[i + 2] as f32 + noise;

        pixels[i] = clamp_u8(r);
        pixels[i + 1] = clamp_u8(g);
        pixels[i + 2] = clamp_u8(b);
    }
}
