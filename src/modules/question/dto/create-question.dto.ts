export class CreateQuestionDto {
    content: string;
    type?: string;
    orderIndex?: number;
    explanation?: string;
    examId: number;
    paragraphId?: number;
}

