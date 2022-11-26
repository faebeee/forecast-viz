export const COLORS = [
    "#4599f2",
    "#01adf4",
    "#00bdf0",
    "#00cde7",
    "#00e1d6",
    "#00f5af",
    "#00ff6e"
]

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

export const SHORT_CACHE_TTL = 60 // 1 minute
export const DEFAULT_CACHE_TTL = !!process.env.REDIS_CACHE_TTL  ? parseInt(process.env.REDIS_CACHE_TTL, 10)  : 60 * 5 // 5 minutes

export const DATE_FORMAT = 'dd/mm/yyyy';
export const PARSE_DATE_FORMAT = 'yyyy-MM-dd';
