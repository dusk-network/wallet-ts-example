# wallet-ts-example
Example for interfacing with the wallet-core wasm from typescript

# Usage
## Install Deno
> https://docs.deno.com/runtime/manual/getting_started/installation

Then<br>
Make sure you have a local node running with the default gensis file
```
deno run --allow-read --allow-net main.ts
```

It uses a modified wasm from the wallet-core. It requires some more utilities which are on https://github.com/dusk-network/wallet-core/tree/wallet-ts-utils 
