import type { Load } from "@sveltejs/kit";
import { compile } from "mdsvex";

export const load: Load = async ({ params }) => {
        let response = await fetch('https://api.github.com/repos/LeqitDev/cc-docs/contents/' + params.slug + '?ref=main', {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Authorization": "Bearer " + import.meta.env.VITE_GITHUB_TOKEN
            }
        });
        let data = atob(await response.json());
        let mdsvex_obj = await compile(data);
};