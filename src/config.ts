export const COLORS = [
    '#004c6d',
    '#115e80',
    '#1f7192',
    '#2d85a5',
    '#3b99b8',
    '#4aaeca',
    '#59c3dc',
    '#69d8ee',
    '#7aeeff',
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
