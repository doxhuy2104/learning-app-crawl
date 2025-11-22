export class CreateExamDto {
    title: string;
    url?: string;
    totalQuestions?: number;
    orderIndex?: number;
    lessonId?: number;
    courseId?: number;
}

