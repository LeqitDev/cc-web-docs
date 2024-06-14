import type { Load } from "@sveltejs/kit";
import { compile } from "mdsvex";
import { compile as svelteCompile } from "svelte/compiler";
import mdx from "remark-mdx";

export const prerender = true;
export const ssr = false;

function fromBinary(encoded: string) {
    return decodeURIComponent(atob(encoded).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  function blobToFile(theBlob: Blob, fileName:string): File {
    const b: any = theBlob;
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModifiedDate = new Date();
    b.name = fileName;
      
    //Cast to a File() type
    return theBlob as File;
  }

export const load: Load = async ({ params }) => {
        let response = await fetch('https://api.github.com/repos/LeqitDev/cc-docs/contents/' + params.slug + '?ref=main', {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Authorization": "Bearer " + import.meta.env.VITE_GITHUB_TOKEN
            }
        });

        const response_json = await response.json();
        const data = fromBinary(response_json.content);
        
        const mdsvex_obj = await compile(data, {
            extensions: [".svelte", ".svx", ".md", ".mdx"],
            layout: "./src/lib/layouts/docs.svelte",
        });
        // console.log(mdsvex_obj?.code);

        if (mdsvex_obj) {
            return { obj: mdsvex_obj }
        }
        
        return { obj: null }
};