import { fetch_doc_entries, doc_entries } from "$lib/store";
import type { Load } from "@sveltejs/kit";
import { get } from "svelte/store";

export const load: Load = async ({ params }) => {
    await fetch_doc_entries();
    return {
        entries: get(doc_entries)
    };
};