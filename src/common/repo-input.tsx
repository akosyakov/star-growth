import * as React from 'react';

export interface RepoInputProps {
    placeholder: string
    onSubmit: (repo: string) => void
}

export default function RepoInput({ placeholder, onSubmit }: RepoInputProps): JSX.Element {
    const [value, setValue] = React.useState<string>('');
    return <input {...{ value, placeholder }}
        style={{
            width: 1080,
            padding: '0 20px',
            lineHeight: 2,
            fontSize: 13,
            marginBottom: 5
        }}
        onChange={e => setValue(e.currentTarget.value)}
        onKeyDown={e => {
            if (e.keyCode === 13) {
                onSubmit(value);
                setValue('');
            }
        }}
    />;
}