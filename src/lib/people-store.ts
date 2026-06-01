import { parsePeoplePayload, type Person } from "./people";

type StoreOptions = {
  ownerRepo: string;
  path: string;
  token: string;
  fetcher?: typeof fetch;
};

type GitHubContentResponse = {
  sha?: string;
  content?: string;
};

export class GitHubPeopleStore {
  private ownerRepo: string;
  private path: string;
  private token: string;
  private fetcher: typeof fetch;

  constructor({ ownerRepo, path, token, fetcher = fetch }: StoreOptions) {
    this.ownerRepo = ownerRepo;
    this.path = path;
    this.token = token;
    this.fetcher = fetcher;
  }

  private url() {
    return `https://api.github.com/repos/${this.ownerRepo}/contents/${this.path}`;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };
  }

  async readRaw(): Promise<{ people: Person[]; sha?: string }> {
    const response = await this.fetcher(this.url(), { headers: this.headers(), cache: "no-store" });
    if (response.status === 404) return { people: [] };
    if (!response.ok) {
      throw new Error(`GitHub read failed: ${response.status}`);
    }

    const data = (await response.json()) as GitHubContentResponse;
    if (!data.content) return { people: [], sha: data.sha };
    const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
    return { people: parsePeoplePayload(JSON.parse(decoded)), sha: data.sha };
  }

  async readPeople(): Promise<Person[]> {
    return (await this.readRaw()).people;
  }

  async writePeople(people: Person[], message = "Update People HQ data"): Promise<void> {
    const current = await this.readRaw();
    const body = {
      message,
      content: Buffer.from(JSON.stringify(parsePeoplePayload(people), null, 2)).toString("base64"),
      sha: current.sha,
    };

    const response = await this.fetcher(this.url(), {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`GitHub write failed: ${response.status}`);
    }
  }
}

export function configuredPeopleStore() {
  const ownerRepo = process.env.PEOPLE_HQ_DATA_REPO;
  const token = process.env.PEOPLE_HQ_GITHUB_TOKEN;
  const path = process.env.PEOPLE_HQ_DATA_PATH || "people.json";
  if (!ownerRepo || !token) {
    throw new Error("People HQ server store is not configured");
  }
  return new GitHubPeopleStore({ ownerRepo, path, token });
}
