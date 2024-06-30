import { writable } from "svelte/store";
import PocketBase from 'pocketbase';

export const esbuild_init = writable(false);

export const pb = new PocketBase('http://pocketbase-hggg4w4.87.181.55.197.sslip.io')