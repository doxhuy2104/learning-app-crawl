export class CreateQuestionDto {
    content: string;
    type?: string;
    dataType?: string;
    orderIndex?: number;
    explanation?: string;
    examId: number;
    paragraphId?: number;
}

