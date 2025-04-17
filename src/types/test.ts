export type ContentType = 'text' | 'image' | 'html';

export interface Content {
  type: ContentType;
  value: string;
}

export type QuestionType = 
  | 'multiple-choice'
  | 'fill-in-blank'
  | 'matching'
  | 'true-false-not-given'
  | 'fill-in-blank-optional'
  | 'map'
  | 'correct-optional';

export interface Question {
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options?: string[];
  answer: string;
}

export interface QuestionGroup {
  group_title?: string;
  group_instruction?: string;
  content?: Content;
  given_words?: string[];
  questions: Question[];
}

export interface Passage {
  passage_number: number;
  title?: string;
  content?: Content;
  audio_url?: string;
  question_groups: QuestionGroup[];
}

export type TestType = 'reading' | 'listening';
export type TestLevel = 'academic' | 'general';

export interface Test {
  test_slug: string;
  type: TestType;
  level: TestLevel;
  title: string;
  duration: number;
  passages: Passage[];
  createdAt?: Date;
  updatedAt?: Date;
} 