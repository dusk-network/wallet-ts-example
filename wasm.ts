// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) DUSK NETWORK. All rights reserved.

interface Wasm {
  readonly instance: WebAssembly.Instance;
}

interface CallResult {
  ptr: number;
  length: number;
  status: boolean;
}

interface TreeLeaf {
  block_height: number;
  note: Uint8Array;
}

interface BalanceResponse {
  maximum: bigint;
  value: bigint;
}

function decompose(result: bigint): CallResult {
  let ptr = result >> 32n;
  let len = ((result << 32n) & ((1n << 64n) - 1n)) >> 48n;
  let success = ((result << 63n) & ((1n << 64n) - 1n)) >> 63n == 0n;

  return {
    ptr: Number(ptr.toString()),
    length: Number(len.toString()),
    status: success,
  };
}

const toBytes = (string: string): Uint8Array => {
  let utf8Encode = new TextEncoder();
  let json_bytes = utf8Encode.encode(string);

  return json_bytes;
};

const alloc = (wasm: Wasm, bytes: Uint8Array): number => {
  var ptr = wasm.instance.exports.malloc(bytes.byteLength);

  var mem = new Uint8Array(
    wasm.instance.exports.memory.buffer,
    ptr,
    bytes.byteLength
  );

  mem.set(new Uint8Array(bytes));

  return ptr;
};

const get_and_free = (wasm: Wasm, result: CallResult): Uint8Array => {
  var mem = new Uint8Array(
    wasm.instance.exports.memory.buffer,
    result.ptr,
    result.length
  );

  wasm.instance.exports.free_mem(result.ptr, result.length);

  return mem;
};

export function getRkyvSerialized(last_pos: number, wasm: Wasm): Uint8Array {
  let json_bytes = toBytes(
    JSON.stringify({
      value: last_pos,
    })
  );

  let ptr = alloc(wasm, json_bytes);
  let call = wasm.instance.exports.rkyv_u64(ptr, json_bytes.byteLength);
  let callResult = decompose(call);
  let bytes = get_and_free(wasm, callResult);

  return bytes;
}

export function getTreeLeafSerialized(leaf: Uint8Array, wasm: Wasm): TreeLeaf {
  let json = JSON.stringify({
    bytes: Array.from(leaf),
  });
  let json_bytes = toBytes(json);

  let ptr = alloc(wasm, json_bytes);

  let call = wasm.instance.exports.rkyv_tree_leaf(ptr, json_bytes.byteLength);
  let callResult = decompose(call);
  let bytes = get_and_free(wasm, callResult);

  let string = new TextDecoder().decode(bytes);
  let tree_leaf: TreeLeaf = JSON.parse(string);

  return tree_leaf;
}

export function getBalance(
  notes: Uint8Array[],
  seed: number[],
  wasm: Wasm
): BalanceResponse {
  let notesJson = JSON.stringify({
    notes: Array.from(notes),
  });

  let json_bytes = toBytes(notesJson);
  let ptr = alloc(wasm, json_bytes);

  let call = wasm.instance.exports.rkyv_notes_array(ptr, json_bytes.byteLength);
  let callResult = decompose(call);
  let bytes = get_and_free(wasm, callResult);

  let balanceArgs = JSON.stringify({
    seed: seed,
    notes: Array.from(bytes),
  });

  console.log(balanceArgs);
  let balance_json = toBytes(balanceArgs);
  let ptrBalance = alloc(wasm, balance_json);
  let callBalance = wasm.instance.exports.balance(
    ptrBalance,
    balance_json.byteLength
  );
  let callResultBalance = decompose(callBalance);
  console.log(callResultBalance);
  let bytesBalance = get_and_free(wasm, callResultBalance);

  let string = new TextDecoder().decode(bytesBalance);

  let balance: BalanceResponse = JSON.parse(string);

  return balance;
}
