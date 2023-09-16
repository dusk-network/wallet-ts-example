import {
  Wasm,
  getRkyvSerialized,
  getTreeLeafSerialized,
  getBalance,
} from "./wasm.ts";
import { readerFromStreamReader } from "https://deno.land/std@0.201.0/streams/mod.ts";

const TRANSFER_CONTRACT =
  "0100000000000000000000000000000000000000000000000000000000000000";
const RKYV_TREE_LEAF_SIZE = 632;
const EXAMPLE_WALLET_SEED = [
  153, 16, 102, 99, 133, 196, 55, 237, 42, 2, 163, 116, 233, 89, 10, 115, 19,
  81, 140, 31, 38, 81, 10, 46, 118, 112, 151, 244, 145, 90, 145, 168, 214, 242,
  68, 123, 116, 76, 223, 56, 200, 60, 188, 217, 34, 113, 55, 172, 27, 255, 184,
  55, 143, 233, 109, 20, 137, 34, 20, 196, 252, 117, 221, 221,
];

function numberToLittleEndianByteArray(num: number): Uint8Array {
  let byteArray = new Uint8Array(4); // Assuming a 32-bit number

  for (let i = 0; i < 4; i++) {
    byteArray[i] = (num >> (i * 8)) & 0xff;
  }

  return byteArray;
}

export async function fetch_notes(wasm: Wasm) {
  // start from 0
  let last_pos = 0;
  let request_name = "leaves_from_pos";
  let request_name_bytes: Uint8Array = new TextEncoder().encode(request_name);
  let pos = getRkyvSerialized(last_pos, wasm);
  let number = numberToLittleEndianByteArray(request_name.length);
  let length = number.length + request_name_bytes.length + pos.byteLength;

  let request = new Uint8Array(length);

  request.set(number, 0);
  request.set(request_name_bytes, number.length);
  request.set(new Uint8Array(pos), number.length + request_name_bytes.length);

  let resp = await fetch("http://127.0.0.1:8080/1/" + TRANSFER_CONTRACT, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "x-rusk-version": "0.6.0",
      "Rusk-Feeder": "1",
    },
    body: request,
  });

  let leaf: Uint8Array;
  let last = 0;
  let notes: Uint8Array[] = [];

  for await (const chunk of resp.body!) {
    leaf = chunk.slice(last, last + RKYV_TREE_LEAF_SIZE);
    last += RKYV_TREE_LEAF_SIZE;

    let tree_leaf = getTreeLeafSerialized(leaf, wasm);
    notes.push(tree_leaf.note);
  }

  let balance = getBalance(notes, EXAMPLE_WALLET_SEED, wasm);
  console.log(balance.value);
}
