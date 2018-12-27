import { Stargazer, StargazersCollection } from "./stargazers";
import { CancellationToken, checkCanceled } from "./cancellation";

export interface DataItem {
    date: number
    repos: {
        [value: string]: RepoItem | undefined
    }
}

export interface RepoItem {
    stars: number
    totalStars: number
    starsGrowthRate?: number
    totalStarsGrowthRate?: number
}

export interface InitialFetchDataOptions {
    months: number
}
export function prepareData({ months }: InitialFetchDataOptions): DataItem[] {
    const items: DataItem[] = [];
    fillTimeSpan(items, { days: 7, ticks: 4 * months });
    items.splice(0, 1);
    return items;
}

export interface FetchDataOptions {
    months: number
    repos: string[]
    stargazers: StargazersCollection
    token: CancellationToken
}
export async function fetchData({ months, repos, stargazers, token }: FetchDataOptions): Promise<DataItem[]> {
    checkCanceled(token);
    const items: DataItem[] = [];
    fillTimeSpan(items, { days: 7, ticks: 4 * months });
    for (const repo of repos || []) {
        const stars: number[] = [];
        await stargazers.collect(repo, ({ starredAt }: Stargazer) => {
            const starredAtDate = new Date(starredAt.slice(0, 10)).getTime();
            return starredAtDate >= items[0].date && (stars.unshift(starredAtDate), true);
        }, token);
        checkCanceled(token);
        fillStars(items, { repo, stars, stargazers });
        fillStarsGrowth(items, repo);
    }
    items.splice(0, 1);
    return items;
}

function fillTimeSpan(items: DataItem[], { days, ticks }: { days: number, ticks: number }): void {
    for (let i = ticks; i >= 0; i--) {
        const tick = new Date(new Date().toISOString().slice(0, 10));
        tick.setDate(tick.getDate() - days * i);
        items.push({
            date: tick.getTime(),
            repos: {}
        })
    }
}

function fillStars(items: DataItem[], options: {
    repo: string
    stars: number[]
    stargazers: StargazersCollection
}): void {
    const { repo, stargazers } = options;
    const starDates = options.stars;
    let totalStars = stargazers.totalStars(repo) - options.stars.length;
    let starIndex = 0;
    for (const item of items) {
        let stars = 0;
        while (starIndex < starDates.length && starDates[starIndex] <= item.date) {
            stars++;
            starIndex++;
        }
        totalStars += stars;
        item.repos[repo] = { totalStars, stars };
    }
}

function fillStarsGrowth(items: DataItem[], repoName: string): void {
    for (let i = 2; i < items.length; i++) {
        const past = items[i - 1].repos[repoName];
        const present = items[i].repos[repoName];
        if (past && present) {
            present.starsGrowthRate = past.totalStars === 0 ? 0 : (present.totalStars - past.totalStars) / past.totalStars
            present.totalStarsGrowthRate = (past.totalStarsGrowthRate || 0) + present.starsGrowthRate;
        }
    }
}