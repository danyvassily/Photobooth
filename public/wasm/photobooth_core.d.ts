/* tslint:disable */
/* eslint-disable */

export function is_wasm_ready(): boolean;

export function wasm_apply_filter(pixels: Uint8Array, width: number, height: number, preset: string): void;

export function wasm_blend_mask(subject: Uint8Array | number[], background: Uint8Array | number[], mask: Uint8Array | number[], output: Uint8Array, width: number, height: number): void;

export function wasm_process_image(pixels: Uint8Array, width: number, height: number, brightness: number, contrast: number, saturation: number, temperature: number, sepia: number, grayscale: boolean, vignette: number, grain: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly is_wasm_ready: () => number;
    readonly wasm_apply_filter: (a: number, b: number, c: any, d: number, e: number, f: number, g: number) => void;
    readonly wasm_blend_mask: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: any, j: number, k: number) => void;
    readonly wasm_process_image: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
