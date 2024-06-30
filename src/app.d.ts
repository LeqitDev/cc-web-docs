// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Issue {
			title: string,
			body: string,
			number: number,
			labels: Label[],
			created_at: string,
			updated_at: string,
			compiled: boolean,
			frontmatter?: { [key: string]: any } 
		}

		interface Label {
			name: string,
			color: string
		}

		interface PandaPicture {
			url: string,
			name: string,
		}
	}
}

export {};
