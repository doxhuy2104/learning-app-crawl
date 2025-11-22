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
        paragraphsCount?: number;
        questionsCount?: number;
        answersCount?: number;
        subjectCount?: number
    };
}

