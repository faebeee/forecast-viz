export const COLORS = [
    '#003f5c',
    '#2f4b7c',
    '#665191',
    '#a05195',
    '#d45087',
    '#f95d6a',
    '#ff7c43',
    '#ffa600',
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
export const COOKIE_TTL = 60 * 60 * 24 * 30;
export const DATE_FORMAT = 'dd/mm/yyyy';
export const PARSE_DATE_FORMAT = 'yyyy-MM-dd';
