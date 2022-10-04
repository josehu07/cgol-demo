use crate::utils;

use wasm_bindgen::prelude::*;

use std::fmt;
use fixedbitset::FixedBitSet;

#[allow(unused_imports)]
use web_sys::console;
use js_sys::Math::random;


/// The universe of cells.
#[derive(Debug, Clone, PartialEq, Eq)]
#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}


/// Threshold of random number for activation when randomly generating.
const RANDOM_THRESHOLD: f64 = 0.3;


impl Universe {
    /// Returns the index in cells bitset for (row, col).
    fn get_index(&self, row: u32, col: u32) -> usize {
        (row * self.width + col) as usize
    }

    /// Returns the number of live neighbors for position.
    fn live_neighbor_count(&self, row: u32, col: u32) -> u8 {
        let mut count = 0;

        for delta_row in [self.height - 1, 0, 1].into_iter() {
            for delta_col in [self.width - 1, 0, 1].into_iter() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (col + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                if self.cells[idx] {
                    count += 1;
                }
            }
        }
        
        count
    }

    /// Getter of cells bitset.
    pub fn get_cells(&self) -> &FixedBitSet {
        &self.cells
    }

    /// Sets given positions to be alive (and clear all others).
    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        self.cells.clear();
        for &(row, col) in cells {
            let idx = self.get_index(row, col);
            self.cells.insert(idx);
        }
    }
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    /// Updates cells data to the next time tick.
    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                let next_alive = match (cell, live_neighbors) {
                    // underpopulated or overpopulated
                    (true, x) if x < 2 || x > 3 => false,
                    // reproduction by comfortable population
                    (false, 3) => true,
                    // other cells remain in the saem state
                    (state, _) => state,
                };

                // if cell != next_alive {
                //     log!("cell[{}, {}] {:?} -> {:?}",
                //          row, col, cell, next_alive);
                // }
                next.set(idx, next_alive);
            }
        }

        self.cells = next;
        // log!("{}", self.to_string());
    }

    /// Creates a universe with an random initial pattern.
    pub fn new(width: u32, height: u32, rand_init: bool) -> Universe {
        if width < 6 || height < 6 {
            panic!("invalid dimension input ({}, {})", width, height);
        }

        utils::set_panic_hook();

        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        if rand_init {
            for i in 0..size {
                cells.set(i, random() < RANDOM_THRESHOLD);
            }
        }
        
        let mut universe = Universe { width, height, cells };
        if !rand_init {
            // otherwise, draw a glider
            let glider = [(1, 3), (2, 1), (2, 3), (3, 2), (3, 3)];
            for (row, col) in glider.into_iter() {
                let idx = universe.get_index(row, col);
                universe.cells.insert(idx);
            }
        }

        universe
    }

    /// Resets the universe to all empty / random state.
    pub fn reset(&mut self, rand_init: bool) {
        if rand_init {
            let size = (self.width * self.height) as usize;
            for i in 0..size {
                self.cells.set(i, random() < RANDOM_THRESHOLD);
            }
        } else {
            self.cells.clear();
        }
    }

    /// Toggles the state of one cell.
    pub fn toggle(&mut self, row: u32, col: u32) {
        let idx = self.get_index(row, col);
        self.cells.toggle(idx);
    }

    /// Returns the string representation.
    pub fn render(&self) -> String {
        self.to_string()
    }

    /// Getter of width.
    pub fn width(&self) -> u32 {
        self.width
    }

    /// Setter of width for testing.
    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        let size = (width * self.height) as usize;
        self.cells = FixedBitSet::with_capacity(size);
    }

    /// Getter of height.
    pub fn height(&self) -> u32 {
        self.height
    }

    /// Setter of height for testing.
    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        let size = (self.width * height) as usize;
        self.cells = FixedBitSet::with_capacity(size);
    }

    /// Returns a pointer to the cells as u32 array.
    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }
}

impl fmt::Display for Universe {
    /// Displays as a matrix of unicode characters.
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for i in 0..self.height {
            for j in 0..self.width {
                let symbol = if self.cells[self.get_index(i, j)] {
                    '◼'
                } else {
                    '◻'
                };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}
