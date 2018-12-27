import { FetchStargazersResult, FetchStargazers } from "./stargazers";

const fetchStargazers: FetchStargazers = async (repoName, cursor) => {
    const [owner, repo] = repoName.split('/', 2);
    const result = await query<{ repository: { stargazers: FetchStargazersResult } }>(`query {
  repository(owner: "${owner}", name: "${repo}") {
    stargazers(last: 100${cursor ? `, before: "${cursor}"` : ''}) {
      edges {
        cursor
        starredAt
      }
      pageInfo {
        hasPreviousPage
      }
      totalCount
    }
  }
}`)
    return result.data.repository.stargazers;
}
export default fetchStargazers;

async function query<T>(query: string): Promise<Query<T>> {
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${'35afd35ce4a9e3403fe06bae8fb2afccb618c002'}`
        }
    });
    return await response.json();
}

interface Query<T> {
    data: T
}
