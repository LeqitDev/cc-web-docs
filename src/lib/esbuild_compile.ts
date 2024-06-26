//import sveltePlugin from 'esbuild-svelte'; // causes reference error (buffer) change the module at line 36
// import Admonition from '$lib/components/Admonition.svelte?raw';
import { compile } from "svelte/compiler";
import MyWorker from "./esbuild_compile.worker?worker";

export const esbuildCompile = async (code: string, callback: (payload: string) => void) => {

	const myWorker = new MyWorker();

	myWorker.postMessage({ a: 1 });
	myWorker.onmessage = (e) => {
		// console.log('Message received from worker', e.data);
		if (e.data.command === "compiled") {
			callback(e.data.payload);
		}
	}

    const vfs: { [key: string]: string } = {
		'main.js': code,
		'DocsLayout.svelte': compile(`<slot />`, { filename: 'DocsLayout.svelte' }).js.code,
	}; // virtual file system for esbuild

	myWorker.postMessage({ command: "compile", payload: { vfs, code } });
};