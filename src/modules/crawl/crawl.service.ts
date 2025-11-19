import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CourseService } from '../course/course.service';
import { LessonService } from '../lesson/lesson.service';
import { ExamService } from '../exam/exam.service';
import { QuestionService } from '../question/question.service';
import { AnswerService } from '../answer/answer.service';
import { CrawlResult } from './interfaces/crawl.interface';

@Injectable()
export class CrawlService {
    private readonly logger = new Logger(CrawlService.name);

    constructor(
        private readonly courseService: CourseService,
        private readonly lessonService: LessonService,
        private readonly examService: ExamService,
        private readonly questionService: QuestionService,
        private readonly answerService: AnswerService,
    ) { }

    async crawlUrl(url: string, cookie?: string): Promise<string> {
        try {
            const headers: any = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Cookie':cookie
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

    async crawlFirstPage(): Promise<CrawlResult> {
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

                if (!courseTitle || courseTitle.includes("Đề thi")) continue;

                const courseData = {
                    title: courseTitle,
                    url: courseUrl,
                };

                const existingCourse = await this.courseService.findByurl(courseUrl);
                let course;

                if (existingCourse) {
                    course = await this.courseService.update(existingCourse.id, courseData);
                } else {
                    course = await this.courseService.create(courseData);
                }

                results.courses.push(course);
                this.logger.log(`Crawled course: ${course.title} (ID: ${course.id})`);

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
                    this.logger.log(`  - Crawled lesson: ${lesson.title} (ID: ${lesson.id})`);

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
                        };

                        const existingExam = await this.examService.findByurl(examUrl);
                        let exam;

                        if (existingExam) {
                            exam = await this.examService.update(existingExam.id, examData);
                        } else {
                            exam = await this.examService.create(examData);
                        }

                        results.exams.push(exam);
                        this.logger.log(`    * Crawled exam: ${exam.title} (ID: ${exam.id})`);
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

    async crawlQuestions(examId: number, examUrl: string, vipCookie?: string): Promise<CrawlResult> {
        try {
            const html = await this.crawlUrl(examUrl, vipCookie);
            const $ = cheerio.load(html);

            const results: {
                questions: any[];
                answers: any[];
            } = {
                questions: [],
                answers: [],
            };

            const questionItems = $('.quiz-answer-item');

            for (let i = 0; i < questionItems.length; i++) {
                const questionElement = questionItems.eq(i);

                // const numberQuestion = questionElement.find('.quiz-answer-left .number-question').text().trim();
                const questionTitle = questionElement.find('.quiz-answer-left .question .title-question').html() || '';

                if (!questionTitle) continue;

                const questionData = {
                    content: questionTitle,
                    type: 'choice',
                    orderIndex: i + 1,
                    examId: examId,
                };

                const question = await this.questionService.create(questionData);
                results.questions.push(question);

                // Extract answers
                const answerElements = questionElement.find('.answer-check.radio .option-choices.js-answer');

                for (let j = 0; j < answerElements.length; j++) {
                    const answerElement = answerElements.eq(j);

                    const isCorrect = answerElement.attr('data-answer') === 'Y';
                    const answerContent = answerElement.find('.option-content').html() || '';

                    if (!answerContent) continue;

                    // Create answer
                    const answerData = {
                        content: answerContent, // Store full HTML including images, formulas
                        isCorrect: isCorrect,
                        orderIndex: j + 1,
                        questionId: question.id,
                    };

                    const answer = await this.answerService.create(answerData);
                    results.answers.push(answer);
                }

                // Extract explanation/solution (optional)
                const explanation = questionElement.find('.quiz-answer-right .result.box-hint').html();
                if (explanation) {
                    // Update question with explanation
                    await this.questionService.update(question.id, {
                        explanation: explanation,
                    } as any);
                }

                this.logger.log(`    * Created ${answerElements.length} answers for question ${i + 1}`);
            }

            this.logger.log(`Completed crawl: ${results.questions.length} questions, ${results.answers.length} answers`);

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

    async crawl(): Promise<CrawlResult> {
        try {
            const pageResult = await this.crawlFirstPage();

            if (!pageResult.success || !pageResult.data) {
                return pageResult;
            }

            const { courses, lessons, exams } = pageResult.data;

            let totalQuestions = 0;
            let totalAnswers = 0;

            for (const exam of exams) {
                const questionsResult = await this.crawlQuestions(exam.id, exam.url);

                if (questionsResult.success && questionsResult.data) {
                    totalQuestions += questionsResult.data.questions.length;
                    totalAnswers += questionsResult.data.answers.length;
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
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

}

