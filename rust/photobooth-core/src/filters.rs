use crate::pixels::{apply_grain, process_pixels};

pub fn apply_preset(pixels: &mut [u8], width: u32, height: u32, preset: &str) {
    match preset {
        "black-and-white" => {
            process_pixels(pixels, width, height, 0.0, 20.0, 0.0, 0.0, 0.0, true, 15.0);
            apply_grain(pixels, width, height, 15.0);
        }
        "sepia" => {
            process_pixels(pixels, width, height, 5.0, 10.0, -10.0, 15.0, 80.0, false, 25.0);
        }
        "vintage" => {
            process_pixels(pixels, width, height, 5.0, 15.0, -15.0, 25.0, 35.0, false, 35.0);
            apply_grain(pixels, width, height, 25.0);
        }
        "film-grain" => {
            process_pixels(pixels, width, height, -2.0, 12.0, -5.0, 10.0, 10.0, false, 20.0);
            apply_grain(pixels, width, height, 40.0);
        }
        "warm" => {
            process_pixels(pixels, width, height, 5.0, 8.0, 10.0, 30.0, 0.0, false, 0.0);
        }
        "cool" => {
            process_pixels(pixels, width, height, 0.0, 5.0, -5.0, -30.0, 0.0, false, 0.0);
        }
        "soft" => {
            process_pixels(pixels, width, height, 8.0, -15.0, -10.0, 5.0, 5.0, false, 10.0);
        }
        "high-contrast" => {
            process_pixels(pixels, width, height, 0.0, 45.0, 15.0, 0.0, 0.0, false, 15.0);
        }
        "faded" => {
            process_pixels(pixels, width, height, 12.0, -20.0, -25.0, 10.0, 15.0, false, 25.0);
            apply_grain(pixels, width, height, 20.0);
        }
        "cinematic" => {
            // Teal & Orange tone shift
            apply_cinematic(pixels, width, height);
            apply_grain(pixels, width, height, 15.0);
        }
        "natural" | _ => {
            // Subtle crispness
            process_pixels(pixels, width, height, 2.0, 5.0, 5.0, 0.0, 0.0, false, 0.0);
        }
    }
}

/// Cinematic Teal/Orange split-toning
fn apply_cinematic(pixels: &mut [u8], width: u32, height: u32) {
    let total = (width * height * 4) as usize;
    for i in (0..total).step_by(4) {
        let r = pixels[i] as f32;
        let g = pixels[i + 1] as f32;
        let b = pixels[i + 2] as f32;

        let luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;

        // Shadows to teal (add B and G, reduce R)
        // Highlights to warm orange (add R and G, reduce B)
        let shadow_weight = (1.0 - luma).powf(1.5);
        let highlight_weight = luma.powf(1.5);

        let nr = r + highlight_weight * 25.0 - shadow_weight * 15.0;
        let ng = g + highlight_weight * 10.0 + shadow_weight * 5.0;
        let nb = b - highlight_weight * 20.0 + shadow_weight * 25.0;

        pixels[i] = nr.clamp(0.0, 255.0) as u8;
        pixels[i + 1] = ng.clamp(0.0, 255.0) as u8;
        pixels[i + 2] = nb.clamp(0.0, 255.0) as u8;
    }
}
