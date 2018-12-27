import { timeFormat } from 'd3-time-format';
import { schemeCategory10 as colors } from 'd3-scale-chromatic';
import * as React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, LineChart, BarChart } from 'recharts';
import { DataItem, prepareData, fetchData, RepoItem } from './model';
import TimeSpan, { TimeSpanValue } from './time-span';
import RepoInput from './repo-input';
import { StargazersCollection, create } from './stargazers';
import createCancellationSource, { isCanceled } from './cancellation';

export default function App(options: { stargazers?: StargazersCollection }): JSX.Element {
    const stargazers = options.stargazers || create({
        fetchStargazers: () => Promise.resolve({
            edges: [],
            pageInfo: { hasPreviousPage: false },
            totalCount: 0
        })
    });

    const [months, setMonths] = React.useState<TimeSpanValue>(1);
    const [repos, setRepos] = React.useState<string[]>([]);

    const [items, setItems] = React.useState<DataItem[]>(prepareData({ months }));
    React.useEffect(() => {
        const cancellation = createCancellationSource();
        (async () => {
            try {
                const items = await fetchData({ months, repos, stargazers, token: cancellation.token });
                setItems(items);
            } catch (e) {
                if (!isCanceled(e)) {
                    throw e;
                }
            }
        })();
        return () => cancellation.cancel()
    }, [months, repos]);

    const start = new Date(items[0].date);
    start.setDate(start.getDate() - 3);
    const startDate = start.getTime();

    const end = new Date(items[items.length - 1].date);
    end.setDate(end.getDate() + 3);
    const endDate = end.getTime();

    const ticks = [startDate];
    for (const item of items) {
        const date = new Date(item.date);
        date.setDate(1);
        const tick = date.getTime();
        if (tick > startDate && tick < endDate && ticks[ticks.length - 1] !== date.getTime()) {
            ticks.push(tick);
        }
    }
    ticks.push(endDate);

    const ChartTitle = ({ label }: { label: string }) => <div><b>{label}</b> in past <TimeSpan value={months} onChange={setMonths} /></div>;
    return <div>
        <div><RepoInput placeholder='theia-ide/theia' onSubmit={repo => {
            if (repos.indexOf(repo) === -1) {
                setRepos([...repos, repo]);
            }
        }} /></div>
        <div style={{ display: 'flex', marginBottom: 20 }}>{
            repos.map((repo, index) => <span key={repo} style={{
                border: '1px solid ' + colors[index],
                marginRight: 5,
                padding: 5
            }} onClick={() => {
                const index = repos.indexOf(repo);
                if (index !== -1) {
                    setRepos([...repos.slice(0, index), ...repos.slice(index + 1)])
                }
            }}>{repo}</span>
            )}</div>
        <ChartTitle label='Stars' />
        <LineChart width={1080} height={600} data={items}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip labelFormatter={formatFullDate} />
            <YAxis />
            <XAxis dataKey="date" type="number"
                domain={[startDate, endDate]}
                tickFormatter={formatShortDate}
                ticks={ticks} />
            {repos.map((name, index) =>
                <Line key={name} type="monotone" dataKey={getValue(name, repo => repo.totalStars)} name={name} stroke={colors[index]} />
            )}
        </LineChart>
        <BarChart width={1080} height={200} data={items} barSize={20}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip labelFormatter={formatFullDate} />
            <YAxis />
            <XAxis dataKey="date" type="number"
                domain={[startDate, endDate]}
                tickFormatter={formatShortDate}
                ticks={ticks} />
            {repos.map((name, index) =>
                <Bar key={name} dataKey={getValue(name, repo => repo.stars)} name={name} fill={colors[index]} />
            )}
        </BarChart>
        <ChartTitle label='Stars Growth Rate' />
        <LineChart width={1080} height={600} data={items}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip labelFormatter={formatFullDate} formatter={formatPercent as any} />
            <YAxis tickFormatter={formatPercent} />
            <XAxis dataKey="date" type="number"
                domain={[startDate, endDate]}
                tickFormatter={formatShortDate}
                ticks={ticks} />
            {repos.map((name, index) =>
                <Line key={name} type="monotone" dataKey={getValue(name, repo => repo.totalStarsGrowthRate || 0)} name={name} stroke={colors[index]} />
            )}
        </LineChart>
        <BarChart width={1080} height={200} data={items} barSize={20}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip labelFormatter={formatFullDate} formatter={formatPercent as any} />
            <YAxis tickFormatter={formatPercent} />
            <XAxis dataKey="date" type="number"
                domain={[startDate, endDate]}
                tickFormatter={formatShortDate}
                ticks={ticks} />
            {repos.map((name, index) =>
                <Bar key={name} dataKey={getValue(name, repo => repo.starsGrowthRate)} name={name} fill={colors[index]} />
            )}
        </BarChart>
        <div><b>Compound Stars Growth Rate</b></div>
        {repos.map(repo => {
            const endRepo = items[items.length - 1].repos[repo];
            const startItem = items.find(item => {
                const itemRepo = item.repos[repo];
                return !!itemRepo && !!itemRepo.totalStars;
            });
            const startRepo = startItem && startItem.repos[repo];
            let value = 'Not Available'
            if (endRepo && startRepo) {
                const endTotalStars = endRepo.totalStars;
                const startTotalStars = startRepo.totalStars;
                const compoundStarsGrowthRate = Math.pow(endTotalStars / startTotalStars, 1 / (items.length - 1)) - 1;
                value = formatPercent(compoundStarsGrowthRate);
            }
            return <div key={repo} style={{ marginLeft: 20, marginTop: 5 }}><label>
                {repo}: {value}
            </label></div>
        })}
    </div>;
}

function formatPercent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
}

function formatFullDate(value: string | number): string {
    return timeFormat('%d %b %Y')(new Date(Number(value)));
}

function formatShortDate(value: string | number): string {
    return timeFormat('%b %y')(new Date(Number(value)));
}

function getValue(repoName: string, cb: (repo: RepoItem) => number | undefined): (item: DataItem) => number | null {
    return item => {
        const repo = item.repos[repoName];
        const result = repo && cb(repo);
        return typeof result === 'number' ? result : null;
    }
}