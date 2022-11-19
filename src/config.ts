export const COLORS = [
    '#003f5c',
    '#ffa600',
    '#2f4b7c',
    '#ff7c43',
    '#665191',
    '#d45087',
    '#a05195',
    '#f95d6a',
];

export const TEAMS = [
    {
        name: "Team Eis",
        key: 'Projektteam 1',
    },
    {
        name: "Team Zwei",
        key: 'Projektteam 2',
    },
    {
        name: "Team Drüü",
        key: 'Projektteam 3',
    },
];

export const REDIS_CACHE_TTL = !!process.env.REDIS_CACHE_TTL ? parseInt(process.env.REDIS_CACHE_TTL) : (60 * 5);
export const DATE_FORMAT = 'dd/mm/yyyy';
export const PARSE_DATE_FORMAT = 'yyyy-MM-dd';
