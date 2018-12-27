import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "../common/app";
import { create, StargazerNodeData, StargazersStorage } from "../common/stargazers";
import fetchStargazers from "../common/fetch-stargazers";

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
    })
};

let stargazersStorage: StargazersStorage | undefined;
if ('indexedDB' in window) {
    const openRequest = window.indexedDB.open('star-growth');
    openRequest.onupgradeneeded = () => openRequest.result.createObjectStore('stargazers');
    const stargazersStore = (mode: IDBTransactionMode = 'readonly') => openRequest.result.transaction('stargazers', mode).objectStore('stargazers');
    const open = promisifyRequest(openRequest);
    stargazersStorage = {
        load: async (repo) => {
            await open;
            const result: StargazerNodeData[] | undefined = await promisifyRequest(stargazersStore().get(repo));
            return result || [];
        },
        save: async (repo, data) => {
            await open;
            await promisifyRequest(stargazersStore('readwrite').put(data, repo));
        }
    };
}

const stargazers = create({ fetchStargazers, stargazersStorage });
const app = document.getElementById("app");
ReactDOM.hydrate(<App {...{ stargazers }} />, app);
