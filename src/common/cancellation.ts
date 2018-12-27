export interface CancellationToken {
    readonly canceled: boolean
}
export interface CancellationSource {
    readonly token: CancellationToken;
    cancel(): void;
}
export function checkCanceled(token?: CancellationToken): void {
    if (token && token.canceled) {
        throw new Error('canceled');
    }
}
export function isCanceled(e: Error): boolean {
    return e.message === 'canceled';
}
export default function createCancellationSource(): CancellationSource {
    const token = { canceled: false };
    const cancel = () => token.canceled = true;
    return { token, cancel };
}