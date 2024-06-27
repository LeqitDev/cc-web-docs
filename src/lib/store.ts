import { writable } from "svelte/store";
import { compileMDsveXAndSvelte } from "$lib/server/compiler";

export const doc_entries = writable<App.Issue[]>([]);

export async function fetch_doc_entries() {
    if (!import.meta.env.VITE_GITHUB_TOKEN) {
        console.error("No GitHub token provided");
        return;
    }
    
    try {
        const response = await fetch('https://api.github.com/repos/LeqitDev/cc-web-docs/issues?labels=docs&state=closed&creator=LeqitDev', {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Authorization": "Bearer " + import.meta.env.VITE_GITHUB_TOKEN
            }
        });
    
        let list = (await response.json()) as App.Issue[]; 
    
        list = await Promise.all(list.map(async (entry: App.Issue) => {
            return compileMDsveXAndSvelte(entry);
        }));
        
        doc_entries.set(list);
    } catch(e: any) {
        console.error(e);
    }
};

// fetch_blog_entries();