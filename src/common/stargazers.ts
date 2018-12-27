import { CancellationToken, checkCanceled } from "./cancellation";

export interface StargazersCollectionOptions {
    fetchStargazers: FetchStargazers
    stargazersStorage?: StargazersStorage
}

export interface StargazersCollection {
    collect(repo: string, accept: (stargazer: Stargazer) => boolean, token?: CancellationToken): Promise<void>;
    totalStars(repo: string): number
    list(repo: string, cursor?: string): Promise<StargazerNode | undefined>
    clean(repo: string): void;
}

export function create({ fetchStargazers, stargazersStorage }: StargazersCollectionOptions): StargazersCollection {
    const allStargazers = new Map<string, Map<string, StargazerNode>>();
    const allTotalStars = new Map<string, number>();
    const list: StargazersCollection['list'] = async (repo, cursor) => {
        let stargazers = allStargazers.get(repo);
        if (!stargazers) {
            stargazers = new Map<string, StargazerNode>();
            allStargazers.set(repo, stargazers);
        }
        const stargazer = cursor && stargazers.get(cursor);
        if (stargazer) {
            if (!stargazer.hasPrevious) {
                return undefined;
            }
            if (stargazer.previous) {
                return stargazer.previous;
            }
        }
        const result = await fetchStargazers(repo, cursor);
        if (!cursor) {
            allTotalStars.set(repo, result.totalCount);
        }
        const { edges } = result;
        let i = edges.length - 1;
        while (i >= 0) {
            const existing = stargazers.get(edges[i].cursor);
            const current = existing || {
                ...edges[i],
                hasPrevious: i !== 0 || result.pageInfo.hasPreviousPage
            };
            if (!existing) {
                stargazers.set(current.cursor, current);
            }
            if (i + 1 !== edges.length) {
                stargazers.get(edges[i + 1].cursor)!.previous = current;
            }
            if (!existing) {
                i--;
            } else {
                i = -1;
            }
        }
        const last = edges[edges.length - 1];
        const node = last && stargazers.get(last.cursor);
        if (stargazer) {
            stargazer.previous = node;
        }
        return node;
    };
    const totalStars: StargazersCollection['totalStars'] = repo => allTotalStars.get(repo) || 0;
    function match(node: StargazerNode | undefined, accept: (stargazer: Stargazer) => boolean): string | undefined {
        let last: StargazerNode | undefined;
        let current: StargazerNode | undefined = node;
        while (current) {
            if (!accept(current)) {
                return undefined;
            }
            last = current;
            current = current.previous;
        }
        return last && last.hasPrevious ? last.cursor : undefined;
    }
    async function load(repo: string): Promise<void> {
        if (stargazersStorage) {
            const data = await stargazersStorage.load(repo);
            const existing = allStargazers.get(repo);
            if (existing && existing.size > data.length) {
                return;
            }
            const nodes = new Map<string, StargazerNode>();
            for (const node of data) {
                nodes.set(node.cursor, { ...node, previous: undefined });
            }
            for (const node of data) {
                const previous = node.previous && nodes.get(node.previous);
                if (previous) {
                    nodes.get(node.cursor)!.previous = previous;
                }
            }
            allStargazers.set(repo, nodes);
        }
    }
    async function save(repo: string): Promise<void> {
        if (stargazersStorage) {
            const nodes: StargazerNodeData[] = [];
            for (const node of allStargazers.get(repo)!.values()) {
                nodes.push({
                    ...node,
                    previous: node.previous && node.previous.cursor
                });
            }
            await stargazersStorage.save(repo, nodes);
        }
    }
    const collect: StargazersCollection['collect'] = async (repo, accept, token) => {
        await load(repo);
        checkCanceled(token);
        let requestCount = 0;
        try {
            let node = await list(repo);
            checkCanceled(token);
            requestCount++;
            let cursor = match(node, accept);
            while (cursor) {
                node = await list(repo, cursor);
                checkCanceled(token);
                requestCount++;
                cursor = match(node, accept);
            }
        } finally {
            console.log('requestCount', requestCount, 'for', repo);
            await save(repo);
        }
    }
    const clean: StargazersCollection['clean'] = repo => {
        allStargazers.delete(repo);
        allTotalStars.delete(repo);
    }
    return { collect, list, totalStars, clean };
}

export interface StargazersStorage {
    load(repo: string): Promise<StargazerNodeData[]>
    save(repo: string, data: StargazerNodeData[]): Promise<void>
}
export interface StargazerNodeData extends Stargazer {
    hasPrevious: boolean
    previous?: string
}

export type FetchStargazers = (repo: string, cursor?: string) => Promise<FetchStargazersResult>

export interface ListStargazersParam extends RepositoryParam {
    cursor?: string
}

export interface RepositoryParam {
    owner: string,
    repo: string
}

export interface FetchStargazersResult {
    edges: Stargazer[]
    pageInfo: {
        hasPreviousPage: boolean
    }
    totalCount: number
}

export interface StargazerNode extends Stargazer {
    hasPrevious: boolean
    previous?: StargazerNode
}

export interface Stargazer {
    cursor: string
    starredAt: string
}