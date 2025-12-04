export class CreateQuestionDto {
    content: string;
    type?: string;
    dataType?: string;
    orderIndex?: number;
    explanation?: string;
    examId: number;
    subExamId?: number;
    paragraphId?: number;
}

