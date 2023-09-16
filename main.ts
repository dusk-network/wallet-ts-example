// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) DUSK NETWORK. All rights reserved.

import rocksdb from "npm:rocksdb@5.2.1";
import Wasm from "./wasm.ts";
import { fetch_notes } from "./node.ts";

const wasmCode = await Deno.readFile("assets/mod.wasm");

const wasmModule = new WebAssembly.Module(wasmCode);
export const instance: Readonly<Wasm> = {
  instance: await WebAssembly.instantiate(wasmModule),
  memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
};

fetch_notes(instance);
