export interface CrawlResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        timestamp: Date;
        url: string;
        itemsCount?: number;
        coursesCount?: number;
        lessonsCount?: number;
        examsCount?: number;
    };
}

