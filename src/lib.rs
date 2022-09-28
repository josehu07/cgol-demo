mod utils;

mod bitaggy;

// When the `cgol_demo` feature is enabled, enable the code path for the
// Conway's game of life demo.
#[cfg(feature = "cgol_demo")]
mod cgol;


// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
