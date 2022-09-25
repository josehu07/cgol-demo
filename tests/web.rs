//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

use std::assert_eq;

use wasm_bindgen_test::*;
use bitaggy::Universe;


// Uncomment below to force run tests with browser drivers.
// wasm_bindgen_test_configure!(run_in_browser);


#[cfg(test)]
pub fn input_spaceship() -> Universe {
    let mut universe = Universe::new(6, 6, false);
    universe.set_cells(&[(1,2), (2,3), (3,1), (3,2), (3,3)]);
    universe
}

#[cfg(test)]
pub fn expected_spaceship() -> Universe {
    let mut universe = Universe::new(6, 6, false);
    universe.set_cells(&[(2,1), (2,3), (3,2), (3,3), (4,2)]);
    universe
}

#[wasm_bindgen_test]
fn test_tick_spaceship() {
    let mut input_universe = input_spaceship();
    let expected_universe = expected_spaceship();
    input_universe.tick();
    assert_eq!(input_universe.width(), expected_universe.width());
    assert_eq!(input_universe.height(), expected_universe.height());
    let input_cells = input_universe.get_cells();
    let expected_cells = expected_universe.get_cells();
    assert!(input_cells.is_subset(expected_cells)
            && input_cells.is_superset(expected_cells));
}
