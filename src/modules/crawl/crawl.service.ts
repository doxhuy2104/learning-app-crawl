import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CourseService } from '../course/course.service';
import { LessonService } from '../lesson/lesson.service';
import { ExamService } from '../exam/exam.service';
import { QuestionService } from '../question/question.service';
import { AnswerService } from '../answer/answer.service';
import { ParagraphService } from '../paragraph/paragraph.service';
import { CrawlResult } from './interfaces/crawl.interface';
import { SubjectService } from '../subject/subject.service';
import { Subject } from '../subject/entities/subject.entity';

@Injectable()
export class CrawlService {
    private readonly logger = new Logger(CrawlService.name);

    constructor(
        private readonly courseService: CourseService,
        private readonly lessonService: LessonService,
        private readonly examService: ExamService,
        private readonly questionService: QuestionService,
        private readonly answerService: AnswerService,
        private readonly paragraphService: ParagraphService,
        private readonly subjectService: SubjectService,

    ) { }

    async crawlUrl(url: string, cookie?: string): Promise<string> {
        try {
            const headers: any = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Cookie': cookie
            };

            const response = await axios.get(url, {
                headers,
                timeout: 30000,
            });
            return response.data;
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }

    extractText($: ReturnType<typeof cheerio.load>, selector: string): string {
        return $(selector).text().trim();
    }

    removeClassFromParagraphs(html: string): string {
        if (!html) return html;

        const $ = cheerio.load(html, {
            decodeEntities: false,
            xmlMode: false,
            withStartIndices: false,
            withEndIndices: false
        });

        $('p').removeAttr('class');

        let result = $.html();

        const bodyContent = $('body').html();
        if (bodyContent) {
            result = bodyContent;
        }

        return result.trim().replace(/\s+/g, " ");
    }

    async crawlTSA(isExam: boolean): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl('https://khoahoc.vietjack.com/trac-nghiem/danh-gia-nang-luc/mon-dh-bach-khoa');
            const $ = cheerio.load(html);

            const results: {
                courses: any[];
                lessons: any[];
                exams: any[];
            } = {
                courses: [],
                lessons: [],
                exams: [],
            };

            const chapterItems = $('.chapter-item');

            for (let i = 0; i < chapterItems.length; i++) {
                const chapterElement = chapterItems.eq(i);

                const courseTitle = chapterElement.find('.chapter-head a span').text().trim();
                const courseUrl = chapterElement.find('.chapter-head a').attr('href') || '';

                if (!courseTitle || (isExam ? !courseTitle.includes("Đề thi") : courseTitle.includes("Đề thi"))) continue;

                const courseData = {
                    title: courseTitle,
                    url: courseUrl,
                    isExam: isExam
                };

                const existingCourse = await this.courseService.findByurl(courseUrl);
                let course;

                if (existingCourse) {
                    course = await this.courseService.update(existingCourse.id, courseData);
                } else {
                    course = await this.courseService.create(courseData);
                }

                results.courses.push(course);

                const lessonItems = chapterElement.find('ul.lesson-wrapper > li.exam-item');

                for (let j = 0; j < lessonItems.length; j++) {
                    const lessonElement = lessonItems.eq(j);

                    const lessonLink = lessonElement.find('.exam-body > p.exam-test.mb-0 > a');
                    if (lessonLink.length === 0) continue;

                    const lessonTitle = lessonLink.text().trim();
                    const collapseId = lessonLink.attr('href') || '';

                    if (!lessonTitle) continue;

                    const lessonData = {
                        title: lessonTitle,
                        url: courseUrl + collapseId,
                        orderIndex: j + 1,
                        courseId: course.id,
                    };

                    const existingLesson = await this.lessonService.findByurl(lessonData.url);
                    let lesson;

                    if (existingLesson) {
                        lesson = await this.lessonService.update(existingLesson.id, lessonData);
                    } else {
                        lesson = await this.lessonService.create(lessonData);
                    }

                    results.lessons.push(lesson);

                    const examItems = lessonElement.find('.collapse ul.lesson-wrapper li.exam-item.last-item');

                    for (let k = 0; k < examItems.length; k++) {
                        const examElement = examItems.eq(k);

                        const examTitleFull = examElement.find('.exam-body p.exam-test a.url-main').text().trim();
                        const examUrl = examElement.find('.exam-body p.exam-test a.url-main').attr('href') || '';

                        if (!examTitleFull || !examUrl) continue;

                        const examData = {
                            title: examTitleFull,
                            url: examUrl,
                            orderIndex: k + 1,
                            lessonId: lesson.id,
                            courseId: course.id
                        };

                        const existingExam = await this.examService.findByurl(examUrl);
                        let exam;

                        if (existingExam) {
                            exam = await this.examService.update(existingExam.id, examData);
                        } else {
                            exam = await this.examService.create(examData);
                        }

                        results.exams.push(exam);
                        this.logger.log(`    * Crawled exam: courseId ${exam.courseId} (ID: ${exam.id})`);
                    }
                }
            }

            this.logger.log(`Completed crawl: ${results.courses.length} courses, ${results.lessons.length} lessons, ${results.exams.length} exams`);

            return {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                    coursesCount: results.courses.length,
                    lessonsCount: results.lessons.length,
                    examsCount: results.exams.length,
                },
            };
        } catch (error) {
            this.logger.error('Error crawling VietJack page:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                },
            };
        }
    }

    async crawlSubjects(): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl('https://khoahoc.vietjack.com/trac-nghiem/tot-nghiep-thpt/mon-Toan');
            const $ = cheerio.load(html);

            const results: Subject[] = [];

            const subjectItems = $('.main-subject').children();

            for (let i = 0; i < subjectItems.length; i++) {
                const chapterElement = subjectItems.eq(i);

                const subjectTitle = chapterElement.find('a .subject-item__name').text().trim();
                const subjectUrl = chapterElement.find('a').attr('href') || '';
                const subjectImage = chapterElement.find('a img').attr('src') || '';

                if (!subjectTitle) continue;

                const subjectData = {
                    title: subjectTitle,
                    url: subjectUrl,
                    image: subjectImage
                };

                const existingSubject = await this.subjectService.findByurl(subjectUrl);
                let subject;

                if (existingSubject) {
                    subject = await this.subjectService.update(existingSubject.id, subjectData);
                } else {
                    subject = await this.subjectService.create(subjectData);
                }

                results.push(subject);
            }

            this.logger.log(`Completed crawl: ${results.length} subjects`);

            return {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                    subjectCount: results.length,
                },
            };
        } catch (error) {
            this.logger.error('Error crawling VietJack page:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                },
            };
        }
    }

    async crawlExams(url: string, subjectId: number): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl(url);
            const $ = cheerio.load(html);

            const results: {
                courses: any[];
                lessons: any[];
                exams: any[];
            } = {
                courses: [],
                lessons: [],
                exams: [],
            };

            const chapterItems = $('.chapter-item');

            let len = chapterItems.length;
            if (subjectId == 1 || subjectId == 3 || subjectId == 4 || subjectId == 5 || subjectId == 10) {
                len = len - 1;
            }

            for (let i = 0; i < len; i++) {
                const chapterElement = chapterItems.eq(i);

                const courseTitle = chapterElement.find('.chapter-head a span').text().trim();
                const courseUrl = chapterElement.find('.chapter-head a').attr('href') || '';

                if (!courseTitle) continue;

                const courseData = {
                    title: courseTitle,
                    url: courseUrl,
                    subjectId: subjectId,
                };

                const existingCourse = await this.courseService.findByurl(courseUrl);
                let course;

                if (existingCourse) {
                    course = await this.courseService.update(existingCourse.id, courseData);
                } else {
                    course = await this.courseService.create(courseData);
                }

                results.courses.push(course);

                const lessonItems = chapterElement.find('ul.lesson-wrapper > li.exam-item');

                for (let j = 0; j < lessonItems.length; j++) {

                    const lessonElement = lessonItems.eq(j);

                    const lessonLink = lessonElement.find('.exam-body > p.exam-test.mb-0 > a');
                    if (lessonLink.length === 0) continue;

                    const lessonTitle = lessonLink.text().trim();
                    const collapseId = lessonLink.attr('href') || '';
                    if (j == 0 && (lessonTitle.includes("Đề thi") || lessonTitle.includes("đề thi") || lessonTitle.includes("Đề ôn") || lessonTitle.includes("đề ôn"))) {
                        this.courseService.update(course.id, { isExam: true });
                    }
                    if (!lessonTitle) continue;

                    const lessonData = {
                        title: lessonTitle,
                        url: courseUrl + collapseId,
                        orderIndex: j + 1,
                        courseId: course.id,
                    };

                    const existingLesson = await this.lessonService.findByurl(lessonData.url);
                    let lesson;

                    if (existingLesson) {
                        lesson = await this.lessonService.update(existingLesson.id, lessonData);
                    } else {
                        lesson = await this.lessonService.create(lessonData);
                    }

                    results.lessons.push(lesson);

                    const examItems = lessonElement.find('.collapse ul.lesson-wrapper li.exam-item.last-item');

                    for (let k = 0; k < examItems.length; k++) {
                        const examElement = examItems.eq(k);

                        const examTitleFull = examElement.find('.exam-body p.exam-test a.url-main').text().trim();
                        const examUrl = examElement.find('.exam-body p.exam-test a.url-main').attr('href') || '';
                        const examQuantity = parseInt(examElement.find('.exam-body div .exam-action a').attr('data-number') || '');
                        if (Number.isNaN(examQuantity)) {
                            continue;
                        }
                        if (!examTitleFull || !examUrl) continue;

                        const examData = {
                            title: examTitleFull,
                            url: examUrl,
                            orderIndex: k + 1,
                            lessonId: lesson.id,
                            courseId: course.id,
                            quantity: examQuantity
                        };

                        const existingExam = await this.examService.findByurl(examUrl);
                        let exam;

                        if (existingExam) {
                            exam = await this.examService.update(existingExam.id, examData);
                        } else {
                            exam = await this.examService.create(examData);
                        }

                        results.exams.push(exam);
                        this.logger.log(`    * Crawled exam: courseId ${exam.courseId} (ID: ${exam.id})`);
                    }
                }
            }

            this.logger.log(`Completed crawl: ${results.courses.length} courses, ${results.lessons.length} lessons, ${results.exams.length} exams`);

            return {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                    coursesCount: results.courses.length,
                    lessonsCount: results.lessons.length,
                    examsCount: results.exams.length,
                },
            };
        } catch (error) {
            this.logger.error('Error crawling VietJack page:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                },
            };
        }
    }


    async crawlParagraphs(examUrl: string, cookie?: string): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl(examUrl, cookie);
            const $ = cheerio.load(html);

            const results: {
                paragraphs: any[];
            } = {
                paragraphs: [],
            };
            const paragraphTitles = $('.text-center');

            const paragraphItems = $('.is-paragraph');

            for (let i = 0; i < paragraphItems.length; i++) {
                const paragraphTitleElement = paragraphItems.eq(i);

                const paragraphElement = paragraphItems.eq(i);

                // const numberparagraph = paragraphElement.find('.quiz-answer-left .number-paragraph').text().trim();
                const paragraphTitle = paragraphTitleElement.text().trim() || '';
                const paragraphContent = paragraphElement.html() || '';

                if (!paragraphTitle) continue;

                const paragraphData = {
                    title: paragraphTitle,
                    content: paragraphContent,
                    orderIndex: i + 1,
                    examId: 1,
                };

                results.paragraphs.push(paragraphData);

            }

            return {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    url: examUrl,
                    itemsCount: results.paragraphs.length,
                },
            };
        } catch (error) {
            this.logger.error('Error crawling VietJack exam paragraphs:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: examUrl,
                },
            };
        }
    }

    async crawlQuestions(examId: number, examUrl: string, cookie?: string, courseId?: number, subExamId?: number): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl(examUrl, cookie);
            const $ = cheerio.load(html);

            const results: {
                // paragraphs: any[];
                questions: any[];
                answers: any[];
            } = {
                // paragraphs: [],
                questions: [],
                answers: [],
            };

            const qasElement = $('.qas').first();

            const qasChildren = qasElement.children();
            console.log(qasChildren.length);
            // const questionItems = $('.quiz-answer-item');

            let trueFalseQuestionId: number | undefined;
            let trueFalseAnswerCount: number = 0;
            for (let i = 0; i < qasChildren.length; i++) {
                const questionElement = qasChildren.eq(i);
                const classes = questionElement.attr('class');

                if (classes?.includes('is-paragraph')) {
                    const questionTitleRaw = questionElement.html() || '';
                    const questionTitle = this.removeClassFromParagraphs(questionTitleRaw);
                    const questionData: any = {
                        content: questionTitle,
                        type: 'true_false',
                        orderIndex: i + 1,
                        examId: examId,
                    };

                    const question = await this.questionService.create(questionData);
                    results.questions.push(question);

                    trueFalseQuestionId = question.id;
                    trueFalseAnswerCount = 0;
                    // results.paragraphs.push(paragraph);
                } else {
                    if (trueFalseQuestionId != undefined) {
                        trueFalseAnswerCount++;
                        if (trueFalseAnswerCount > 4) {
                            trueFalseAnswerCount = 0;
                            trueFalseQuestionId = undefined;
                        }
                        else {
                            const answerContentRaw = questionElement.find('.quiz-answer-left .question .title-question').html() || '';

                            if (!answerContentRaw) continue;

                            const answerContent = this.removeClassFromParagraphs(answerContentRaw);


                            const explanationRaw = questionElement.find('.quiz-answer-right .result.box-hint').html();
                            if (!explanationRaw) continue;
                            const explanation = this.removeClassFromParagraphs(explanationRaw);

                            const isCorrect = explanationRaw.includes("Đúng");

                            const answerData = {
                                content: answerContent,
                                isCorrect: isCorrect,
                                orderIndex: trueFalseAnswerCount,
                                questionId: trueFalseQuestionId,
                            };

                            const answer = await this.answerService.create(answerData);
                            results.answers.push(answer);
                        }
                    } else {
                        // const numberQuestion = questionElement.find('.quiz-answer-left .number-question').text().trim();
                        const questionTitleRaw = questionElement.find('.quiz-answer-left .question .title-question').html() || '';

                        if (!questionTitleRaw) continue;

                        const questionTitle = this.removeClassFromParagraphs(questionTitleRaw);

                        // Check answer elements to determine question type
                        const answerContainer = questionElement.find('.answer-check.radio');
                        const optionNoneElements = answerContainer.find('.option-choices.option-none');
                        // const trueFalseOption = answerContainer.find('.true_false-option');
                        const choiceOptions = answerContainer.find('.option-choices.js-answer[data-answer]');

                        let type: string;
                        let answerElements;
                        let shortAnswer: string | null = null;
                        let trueFalse: boolean | null = null;

                        if (optionNoneElements.length > 0) {
                            type = "short_answer";
                        }
                        else {
                            type = "choice";
                            answerElements = choiceOptions;
                        }

                        const questionData: any = {
                            content: questionTitle,
                            type: type,
                            orderIndex: i + 1,
                            examId: examId,
                        };

                        // Add shortAnswer or trueFalse based on type
                        if (type === "short_answer") {
                            questionData.shortAnswer = null; // Will be set from explanation or answer
                        } else if (type === "true_false") {
                            questionData.trueFalse = null; // Will be set from answer
                        }

                        const question = await this.questionService.create(questionData);
                        results.questions.push(question);



                        if (answerElements != undefined)
                            for (let j = 0; j < answerElements.length; j++) {
                                const answerElement = answerElements.eq(j);

                                const isCorrect = answerElement.attr('data-answer') === 'Y';
                                const answerContentRaw = answerElement.find('.option-content').html() || '';

                                if (!answerContentRaw) continue;

                                const answerContent = this.removeClassFromParagraphs(answerContentRaw);

                                const answerData = {
                                    content: answerContent,
                                    isCorrect: isCorrect,
                                    orderIndex: j + 1,
                                    questionId: question.id,
                                };

                                const answer = await this.answerService.create(answerData);
                                results.answers.push(answer);
                            }

                        const explanationRaw = questionElement.find('.quiz-answer-right .result.box-hint').html();
                        if (explanationRaw) {
                            const explanation = this.removeClassFromParagraphs(explanationRaw);
                            await this.questionService.update(question.id, {
                                explanation: explanation,
                            } as any);
                        }
                    }
                }
            }


            return {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    url: examUrl,
                    itemsCount: results.questions.length,
                },
            };
        } catch (error) {
            this.logger.error('Error crawling VietJack exam questions:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: examUrl,
                },
            };
        }
    }

    async crawlQuestionsTSA(examId: number, examUrl: string, cookie?: string, courseId?: number, subExamId?: number): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl(examUrl, cookie);
            const $ = cheerio.load(html);

            const results: {
                paragraphs: any[];
                questions: any[];
                answers: any[];
            } = {
                paragraphs: [],
                questions: [],
                answers: [],
            };

            const qasElement = $('.qas').first();

            const qasChildren = qasElement.children();
            console.log(qasChildren.length);
            // const questionItems = $('.quiz-answer-item');

            let paragraphId: number | undefined;
            let paragraphTitle: string = '';
            let titleExamId: string = '';
            for (let i = 0; i < qasChildren.length; i++) {
                const questionElement = qasChildren.eq(i);
                const classes = questionElement.attr('class');
                if (classes?.includes('text-center')) {
                    paragraphTitle = questionElement.text().trim();
                    titleExamId = `${paragraphTitle}-${examId}`;
                } else if (classes?.includes('is-paragraph')) {
                    const paragraphContentRaw = questionElement.html() || '';
                    const paragraphContent = this.removeClassFromParagraphs(paragraphContentRaw);
                    const paragraphData = {
                        content: paragraphContent,
                        title: paragraphTitle,
                        examId: examId,
                        titleExamId: titleExamId
                    };

                    const existingParagraph = await this.paragraphService.findByTitleExamId(titleExamId);
                    let paragraph;

                    if (existingParagraph) {
                        paragraph = await this.paragraphService.update(existingParagraph.id, paragraphData);
                    } else {
                        paragraph = await this.paragraphService.create(paragraphData);
                    }
                    paragraphId = paragraph.id;
                    results.paragraphs.push(paragraph);
                } else {

                    // const numberQuestion = questionElement.find('.quiz-answer-left .number-question').text().trim();
                    const questionTitleRaw = questionElement.find('.quiz-answer-left .question .title-question').html() || '';

                    if (!questionTitleRaw) continue;

                    const questionTitle = this.removeClassFromParagraphs(questionTitleRaw);

                    const hasTable = questionElement.find('table').length > 0;
                    const hasBlank = questionTitle.includes("_____");

                    function detectDragDrop(html: string): boolean {
                        const $ = cheerio.load(html);

                        const paragraphs = $('p');

                        for (let i = 0; i < paragraphs.length; i++) {
                            const $p = $(paragraphs[i]);

                            const children = $p.contents();

                            let consecutiveImgSpans = 0;
                            let maxConsecutive = 0;

                            children.each((j, node) => {
                                if (node.type === 'tag' && node.name === 'span') {
                                    const $span = $(node);
                                    const hasImg = $span.find('img').length > 0;

                                    if (hasImg) {
                                        consecutiveImgSpans++;
                                        maxConsecutive = Math.max(maxConsecutive, consecutiveImgSpans);
                                    } else {
                                        consecutiveImgSpans = 0;
                                    }
                                } else if (node.type === 'text') {
                                    const text = $(node).text().trim();
                                    if (text.length > 0) {
                                        consecutiveImgSpans = 0;
                                    }
                                } else {
                                    consecutiveImgSpans = 0;
                                }
                            });

                            if (maxConsecutive >= 2) {
                                return true;
                            }
                        }

                        return false;
                    }

                    const hasDragDropImages = detectDragDrop(questionTitle) || questionTitle.includes("éo thả");
                    let type: string;
                    if (hasTable) {
                        type = "true_false";
                    } else if (hasDragDropImages) {
                        type = "drag_drop";
                    } else if (hasBlank) {
                        type = "fill_blank";
                    } else {
                        type = 'choice';
                    }

                    const answerElements = questionElement.find('.answer-check.radio .option-choices.js-answer');


                    const questionData = {
                        content: questionTitle,
                        type: type,
                        orderIndex: i + 1,
                        examId: examId,
                        paragraphId: paragraphId
                    };

                    const question = await this.questionService.create(questionData);
                    results.questions.push(question);


                    for (let j = 0; j < answerElements.length; j++) {
                        const answerElement = answerElements.eq(j);

                        const isCorrect = answerElement.attr('data-answer') === 'Y';
                        const answerContentRaw = answerElement.find('.option-content').html() || '';

                        if (!answerContentRaw) continue;

                        const answerContent = this.removeClassFromParagraphs(answerContentRaw);

                        const answerData = {
                            content: answerContent,
                            isCorrect: isCorrect,
                            orderIndex: j + 1,
                            questionId: question.id,
                        };

                        const answer = await this.answerService.create(answerData);
                        results.answers.push(answer);
                    }

                    const explanationRaw = questionElement.find('.quiz-answer-right .result.box-hint').html();
                    if (explanationRaw) {
                        const explanation = this.removeClassFromParagraphs(explanationRaw);
                        await this.questionService.update(question.id, {
                            explanation: explanation,
                        } as any);
                    }

                }
            }


            return {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    url: examUrl,
                    itemsCount: results.questions.length,
                },
            };
        } catch (error) {
            this.logger.error('Error crawling VietJack exam questions:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: examUrl,
                },
            };
        }
    }

    async crawlCourses(cookie?: string): Promise<CrawlResult> {
        try {
            const pageResult = await this.crawlTSA(false);

            if (!pageResult.success || !pageResult.data) {
                return pageResult;
            }

            const { courses, lessons, exams } = pageResult.data;

            let totalQuestions = 0;
            let totalAnswers = 0;

            for (const exam of exams) {
                const questionsResult = await this.crawlQuestions(exam.id, exam.url, cookie);

                if (questionsResult.success && questionsResult.data) {
                    totalQuestions += questionsResult.data.questions.length;
                    totalAnswers += questionsResult.data.answers.length;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.logger.log(`Completed full crawl: ${courses.length} courses, ${lessons.length} lessons, ${exams.length} exams, ${totalQuestions} questions, ${totalAnswers} answers`);

            return {
                success: true,
                data: {
                    courses,
                    lessons,
                    exams,
                    totalQuestions,
                    totalAnswers,
                },
                metadata: {
                    timestamp: new Date(),
                    url: '',
                    coursesCount: courses.length,
                    lessonsCount: lessons.length,
                    examsCount: exams.length,
                },
            };
        } catch (error) {
            this.logger.error('Error in complete VietJack crawl:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                },
            };
        }
    }

    async crawlExamsTSA(cookie?: string): Promise<CrawlResult> {
        try {
            const pageResult = await this.crawlTSA(true);

            if (!pageResult.success || !pageResult.data) {
                return pageResult;
            }

            const { courses, lessons, exams } = pageResult.data;

            let totalQuestions = 0;
            let totalAnswers = 0;

            for (const exam of exams) {
                const questionsResult = await this.crawlQuestions(exam.id, exam.url, cookie, exam.courseId);

                if (questionsResult.success && questionsResult.data) {
                    totalQuestions += questionsResult.data.questions.length;
                    totalAnswers += questionsResult.data.answers.length;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }


            return {
                success: true,
                data: {
                    courses,
                    lessons,
                    exams,
                    totalQuestions,
                    totalAnswers,
                },
                metadata: {
                    timestamp: new Date(),
                    url: '',
                    coursesCount: courses.length,
                    lessonsCount: lessons.length,
                    examsCount: exams.length,
                },
            };
        } catch (error) {
            this.logger.error('Error in complete VietJack crawl:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                },
            };
        }
    }

    async crawlTHPT(cookie?: string): Promise<CrawlResult> {
        try {
            const subjectsResult = await this.crawlSubjects();
            if (!subjectsResult.success || !subjectsResult.data) {
                return subjectsResult;
            }

            const subjects = subjectsResult.data as Subject[];

            const allCourses: any[] = [];
            const allLessons: any[] = [];
            const allExams: any[] = [];
            let totalQuestions = 0;
            let totalAnswers = 0;

            for (const subject of subjects) {
                const pageResult = await this.crawlExams(subject.url, subject.id);

                if (!pageResult.success || !pageResult.data) {
                    return pageResult;
                }

                const { courses, lessons, exams } = pageResult.data;

                allCourses.push(...courses);
                allLessons.push(...lessons);
                allExams.push(...exams);

                // for (const exam of exams) {
                // const questionsResult = await this.crawlQuestions(exam.id, exam.url, cookie, exam.courseId);

                // if (questionsResult.success && questionsResult.data) {
                //     totalQuestions += questionsResult.data.questions.length;
                //     totalAnswers += questionsResult.data.answers.length;
                // }

                // await new Promise(resolve => setTimeout(resolve, 500));
                // }
            }

            this.logger.log(`Completed THPT crawl: ${allCourses.length} courses, ${allLessons.length} lessons, ${allExams.length} exams, ${totalQuestions} questions, ${totalAnswers} answers`);

            return {
                success: true,
                data: {
                    courses: allCourses,
                    lessons: allLessons,
                    exams: allExams,
                    totalQuestions,
                    totalAnswers,
                },
                metadata: {
                    timestamp: new Date(),
                    url: '',
                    coursesCount: allCourses.length,
                    lessonsCount: allLessons.length,
                    examsCount: allExams.length,
                },
            };
        } catch (error) {
            this.logger.error('Error in complete VietJack crawl:', error.message);
            return {
                success: false,
                error: error.message,
                metadata: {
                    timestamp: new Date(),
                    url: '',
                },
            };
        }
    }

}

