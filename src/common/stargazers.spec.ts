import * as assert from 'assert';
import { create, Stargazer } from "./stargazers";

describe('fetch-stars', () => {

    const repo = 'repo';
    const starredAt = new Date('2018-12-30');
    const stargazers: Stargazer[] = [];
    for (let i = 0; i < 9; i++) {
        const date = new Date(starredAt);
        date.setDate(starredAt.getDate() - 8 + i);
        stargazers.push({
            cursor: String(i),
            starredAt: date.toISOString()
        });
    }
    let fetches = 0;
    const all = create({
        fetchStargazers: async (_, cursor) => {
            fetches++;
            const index = cursor ? Number(cursor) : stargazers.length;
            const startIndex = Math.max(0, index - 3);
            const edges = stargazers.slice(startIndex, index);
            return {
                edges,
                pageInfo: {
                    hasPreviousPage: startIndex > 0
                },
                totalCount: stargazers.length
            };
        }
    });

    afterEach(() => {
        fetches = 0;
    });

    it('list without cursor', async () => {
        assert.equal(0, all.totalStars(repo));
        const node = await all.list(repo);
        assert.equal(`{
  "cursor": "8",
  "starredAt": "2018-12-30T00:00:00.000Z",
  "hasPrevious": true,
  "previous": {
    "cursor": "7",
    "starredAt": "2018-12-29T00:00:00.000Z",
    "hasPrevious": true,
    "previous": {
      "cursor": "6",
      "starredAt": "2018-12-28T00:00:00.000Z",
      "hasPrevious": true
    }
  }
}`, JSON.stringify(node, undefined, 2));
        assert.equal(9, all.totalStars(repo));
        assert.equal(1, fetches);
    });

    it('list with 6 as cursor', async () => {
        const node = await all.list(repo, '6');
        assert.equal(`{
  "cursor": "5",
  "starredAt": "2018-12-27T00:00:00.000Z",
  "hasPrevious": true,
  "previous": {
    "cursor": "4",
    "starredAt": "2018-12-26T00:00:00.000Z",
    "hasPrevious": true,
    "previous": {
      "cursor": "3",
      "starredAt": "2018-12-25T00:00:00.000Z",
      "hasPrevious": true
    }
  }
}`, JSON.stringify(node, undefined, 2));
        assert.equal(1, fetches);
    });

    it('list with 3 as cursor', async () => {
        const node = await all.list(repo, '3');
        assert.equal(`{
  "cursor": "2",
  "starredAt": "2018-12-24T00:00:00.000Z",
  "hasPrevious": true,
  "previous": {
    "cursor": "1",
    "starredAt": "2018-12-23T00:00:00.000Z",
    "hasPrevious": true,
    "previous": {
      "cursor": "0",
      "starredAt": "2018-12-22T00:00:00.000Z",
      "hasPrevious": false
    }
  }
}`, JSON.stringify(node, undefined, 2));
        assert.equal(1, fetches);
    });

    it('list with 2 as cursor', async () => {
        const node = await all.list(repo, '2');
        assert.equal(`{
  "cursor": "1",
  "starredAt": "2018-12-23T00:00:00.000Z",
  "hasPrevious": true,
  "previous": {
    "cursor": "0",
    "starredAt": "2018-12-22T00:00:00.000Z",
    "hasPrevious": false
  }
}`, JSON.stringify(node, undefined, 2));
        assert.equal(0, fetches);
    });

    it('list with 0 as cursor', async () => {
        const node = await all.list(repo, '0');
        assert.equal(undefined, JSON.stringify(node, undefined, 2));
        assert.equal(0, fetches);
    });

    it('list without cursor again', async () => {
        const node = await all.list(repo);
        assert.equal(`{
  "cursor": "8",
  "starredAt": "2018-12-30T00:00:00.000Z",
  "hasPrevious": true,
  "previous": {
    "cursor": "7",
    "starredAt": "2018-12-29T00:00:00.000Z",
    "hasPrevious": true,
    "previous": {
      "cursor": "6",
      "starredAt": "2018-12-28T00:00:00.000Z",
      "hasPrevious": true,
      "previous": {
        "cursor": "5",
        "starredAt": "2018-12-27T00:00:00.000Z",
        "hasPrevious": true,
        "previous": {
          "cursor": "4",
          "starredAt": "2018-12-26T00:00:00.000Z",
          "hasPrevious": true,
          "previous": {
            "cursor": "3",
            "starredAt": "2018-12-25T00:00:00.000Z",
            "hasPrevious": true,
            "previous": {
              "cursor": "2",
              "starredAt": "2018-12-24T00:00:00.000Z",
              "hasPrevious": true,
              "previous": {
                "cursor": "1",
                "starredAt": "2018-12-23T00:00:00.000Z",
                "hasPrevious": true,
                "previous": {
                  "cursor": "0",
                  "starredAt": "2018-12-22T00:00:00.000Z",
                  "hasPrevious": false
                }
              }
            }
          }
        }
      }
    }
  }
}`, JSON.stringify(node, undefined, 2));
        assert.equal(1, fetches);
    });

    it('list without cursor with new stargazer', async () => {
        assert.equal(9, all.totalStars(repo));
        stargazers.push({
            cursor: String(stargazers.length),
            starredAt: starredAt.toISOString()
        });
        const node = await all.list(repo);
        assert.equal(`{
  "cursor": "9",
  "starredAt": "2018-12-30T00:00:00.000Z",
  "hasPrevious": true,
  "previous": {
    "cursor": "8",
    "starredAt": "2018-12-30T00:00:00.000Z",
    "hasPrevious": true,
    "previous": {
      "cursor": "7",
      "starredAt": "2018-12-29T00:00:00.000Z",
      "hasPrevious": true,
      "previous": {
        "cursor": "6",
        "starredAt": "2018-12-28T00:00:00.000Z",
        "hasPrevious": true,
        "previous": {
          "cursor": "5",
          "starredAt": "2018-12-27T00:00:00.000Z",
          "hasPrevious": true,
          "previous": {
            "cursor": "4",
            "starredAt": "2018-12-26T00:00:00.000Z",
            "hasPrevious": true,
            "previous": {
              "cursor": "3",
              "starredAt": "2018-12-25T00:00:00.000Z",
              "hasPrevious": true,
              "previous": {
                "cursor": "2",
                "starredAt": "2018-12-24T00:00:00.000Z",
                "hasPrevious": true,
                "previous": {
                  "cursor": "1",
                  "starredAt": "2018-12-23T00:00:00.000Z",
                  "hasPrevious": true,
                  "previous": {
                    "cursor": "0",
                    "starredAt": "2018-12-22T00:00:00.000Z",
                    "hasPrevious": false
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`, JSON.stringify(node, undefined, 2));
        assert.equal(10, all.totalStars(repo));
        assert.equal(1, fetches);
    });

    it('collect', async () => {
        all.clean(repo);

        const cursors: string[] = [];
        await all.collect(repo, ({ cursor }) => (cursors.push(cursor), true));
        assert.equal(`[
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1",
  "0"
]`, JSON.stringify(cursors, undefined, 2));
    });

});