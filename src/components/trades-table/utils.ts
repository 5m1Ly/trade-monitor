export function format(n: number | null | undefined) {
    if (n == null || Number.isNaN(n)) return '—';
    return n.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    });
}
