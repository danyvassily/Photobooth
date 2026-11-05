/// Blends a segmented subject over a background using a confidence mask (0..255).
/// Performs alpha composition with soft edge blending.
pub fn blend_mask(
    subject: &[u8],
    background: &[u8],
    mask: &[u8],
    output: &mut [u8],
    width: u32,
    height: u32,
) {
    let num_pixels = (width * height) as usize;
    if subject.len() < num_pixels * 4
        || background.len() < num_pixels * 4
        || mask.len() < num_pixels
        || output.len() < num_pixels * 4
    {
        return;
    }

    for i in 0..num_pixels {
        let mask_val = mask[i] as f32 / 255.0; // 0.0 (bg) to 1.0 (subject)
        let inv_mask = 1.0 - mask_val;

        let px = i * 4;
        let sr = subject[px] as f32;
        let sg = subject[px + 1] as f32;
        let sb = subject[px + 2] as f32;
        let sa = subject[px + 3] as f32 / 255.0;

        let br = background[px] as f32;
        let bg = background[px + 1] as f32;
        let bb = background[px + 2] as f32;
        let ba = background[px + 3] as f32 / 255.0;

        let final_alpha = mask_val * sa + inv_mask * ba;

        if final_alpha > 0.0 {
            let r = (sr * mask_val * sa + br * inv_mask * ba) / final_alpha;
            let g = (sg * mask_val * sa + bg * inv_mask * ba) / final_alpha;
            let b = (sb * mask_val * sa + bb * inv_mask * ba) / final_alpha;

            output[px] = r.clamp(0.0, 255.0) as u8;
            output[px + 1] = g.clamp(0.0, 255.0) as u8;
            output[px + 2] = b.clamp(0.0, 255.0) as u8;
            output[px + 3] = (final_alpha * 255.0).clamp(0.0, 255.0) as u8;
        } else {
            output[px] = 0;
            output[px + 1] = 0;
            output[px + 2] = 0;
            output[px + 3] = 0;
        }
    }
}
