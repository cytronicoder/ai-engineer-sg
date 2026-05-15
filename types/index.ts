export type Speaker = {
    id: string;
    name: string;
    title?: string;
    company?: string;
    bio?: string;
    image?: string;
};

export type Session = {
    id: string;
    title: string;
    description?: string;
    startsAt?: string;
    endsAt?: string;
    day?: string;
    room?: string;
    venue?: string;
    format?: string;
    track?: string;
    speakers: Speaker[];
    tags: string[];
    companyNames: string[];
};

export type InterestKey =
    | "agents"
    | "coding"
    | "evals"
    | "infrastructure"
    | "design"
    | "open-models"
    | "robotics"
    | "singapore-ai"
    | "research"
    | "student-builders";

export type InterestOption = {
    key: InterestKey;
    label: string;
};

export type ApiMode = "live" | "fallback";

export type SortMode = "time" | "recommended" | "saved";

export type DayFilter = "all" | string;

export type AppTab = "schedule" | "plan" | "connect";

export type RankedSession = Session & {
    score: number;
    matchedInterests: string[];
};
