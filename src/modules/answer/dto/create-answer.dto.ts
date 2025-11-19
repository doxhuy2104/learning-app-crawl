export class CreateAnswerDto {
    content: string;
    isCorrect?: boolean;
    orderIndex?: number;
    questionId: number;
}

