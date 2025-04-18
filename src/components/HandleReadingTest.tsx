'use client';
import useSWR from 'swr';
import Spinner from './Spinner';
import { Passage, Test } from '@/types/test';
import { useEffect, useRef, useState } from 'react';
export default function HandleReadingTest({ test_slug }: { test_slug: string}) {
    const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
    const [answered, setAnswered] = useState<Set<number>>(new Set());
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [countDown, setCountDown] = useState<boolean>(false);
    const questionRef = useRef<(HTMLDivElement | null)[]>([]);
    const handleAnswer = (questionNumber: number, value: string) => {
        setAnswered((prevState) => {
            const newSet = new Set(prevState);
            if (value) {
                newSet.add(questionNumber);
            } else {
                newSet.delete(questionNumber);
            }
            return newSet;
        }) 
    }
    const scrollToQuestion = (questionNumber: number) => {
        const target = questionRef.current[questionNumber];
        if (target) {
            target.scrollIntoView({behavior: 'smooth'});
        }

    }
    const fetcher = (url: string) => fetch(url).then(res => res.json());
    const { data, error, isLoading } = useSWR<Test>(
        `${process.env.NEXT_PUBLIC_READING_API_URL}/${test_slug}`,
        fetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )
    useEffect(() => {
        if (data) {
            setRemainingTime(data.duration * 60);
            setCountDown(true);
        }
    }, [data]);

    useEffect(() => {
        if (!countDown || remainingTime <= 0) return;
        const timer = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCountDown(false);
                }
                return prev - 1;
            })
        }, 1000)
        return () => clearInterval(timer);
    }, [countDown]);
        

    if (isLoading) return <Spinner />
    if (error) return <div>Error: {error.message}</div>
    if (!data) return <div>No data found for the test slug: {test_slug}</div>
    const { title, passages, duration, level } = data;
    
    return (
        <div className='w-full'>
            <h1 className='mt-8 text-2xl font-bold text-center'>{title} / <span className="text-md text-orange-500">{level}</span></h1>
            <div className="w-full mt-4 flex">
                {passages.map((passage) => (
                    <button 
                    key={passage.passage_number}
                    onClick={() => setSelectedPassage(passage)}
                    className={`bg-gray-400 text-white font-semibold p-4 mb-5 rounded-[50%] mx-5 hover:bg-orange-500 hover:cursor-pointer transition-colors duration-300 ease-in-out ${selectedPassage?.passage_number===passage.passage_number ? 'bg-orange-500' : ''}`}>
                        Passage {passage.passage_number}
                    </button>
                ))}
            </div>
            <div className="passage-container w-full h-[60vh]">
                {selectedPassage && ( // if there is a selected passage, then render the passage
                    <div className="w-full flex h-full p-5">
                        <div className="flex w-10/12 rounded-lg">
                            <div className="w-[60%] px-4 overflow-y-auto">
                                <h2 className="font-bold text-2xl mt-4">{selectedPassage.title}</h2>
                                <div className="mt-2 text-justify leading-loose text-xl">
                                    {selectedPassage.content?.value}
                                </div>
                            </div>
                            <div className="w-[40%] mt-5 px-5 overflow-y-auto h-full">
                                <div className="">
                                    {selectedPassage.question_groups.map((group) => (
                                        <div key={group.group_title} className="text-justify leading-loose text-xl">
                                            <h3 className="font-bold text-xl">{group.group_title}</h3>
                                            <p>{group.group_instruction}</p>
                                            { group.given_words && group.given_words.length > 0 && (
                                                <div className="border-1 rounded-lg p-2">
                                                    {group.given_words?.map((word) => (
                                                        <div key={word} className="border-1 rounded-lg p-2">
                                                            {word}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mb-5">
                                                {group.questions.map((question) => (
                                                    <div key={question.question_number} ref={el => {questionRef.current[question.question_number] = el}}>
                                                        {question.question_type === 'fill-in-blank' && (
                                                            <div>
                                                                <div>{question.question_number}. {question.question_text}</div>
                                                                <div>
                                                                    <input type="text" className="border-1 rounded-lg p-2" 
                                                                    name={`answer-${question.question_number}`}
                                                                    onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {question.question_type === 'fill-in-blank-optional' && (
                                                            <div>
                                                                <div>{question.question_number}. {question.question_text}</div>
                                                                <div>
                                                                    <select className="bg-gray-200 p-2 rounded-lg max-w-[60%]" 
                                                                    name={`answer-${question.question_number}`}
                                                                    onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                    >
                                                                        <option value="">Select an option</option>
                                                                        {group?.given_words?.map((option) => (
                                                                            <option key={option} value={option}>{option}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {question.question_type === 'true-false-not-given' && (
                                                            <div>
                                                                <div>{question.question_number}. {question.question_text}</div>
                                                                <div>
                                                                    <select className="bg-gray-200 p-2 rounded-lg max-w-[60%]" 
                                                                    name={`answer-${question.question_number}`}
                                                                    onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                    >
                                                                        <option value="">Select an option</option>
                                                                        <option value="True">True</option>
                                                                        <option value="False">False</option>
                                                                        <option value="Not Given">Not Given</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {question.question_type === 'multiple-choice' && (
                                                            <div>
                                                                <div>{question.question_number}. {question.question_text}</div>
                                                                <div>
                                                                    {question?.options?.map((option) => (
                                                                        <div className="flex items-center gap-2" key={option}>
                                                                            <input className="size-5" type="checkbox" key={option} 
                                                                            name={`answer-${question.question_number}`} 
                                                                            value={option} 
                                                                            onChange={(event) => {
                                                                                const checkboxed = document.querySelectorAll(`input[name="answer-${question.question_number}"]:checked`);
                                                                                if (checkboxed.length === 0) {
                                                                                    handleAnswer(question.question_number, '');
                                                                                } else {
                                                                                    handleAnswer(question.question_number, event.target.value);
                                                                                }
                                                                            }}
                                                                            />
                                                                            <label>{option}</label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(question.question_type === 'matching' || question.question_type === 'correct-optional') && (
                                                            <div>
                                                                <div>{question.question_number}. {question.question_text}</div>
                                                                <div>
                                                                    <select className="bg-gray-200 p-2 rounded-lg max-w-[60%]" 
                                                                    name={`answer-${question.question_number}`}
                                                                    onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                    >
                                                                        <option value="">Select an option</option>
                                                                        {question?.options?.map((option) => (
                                                                            <option key={option} value={option}>{option}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="w-2/12 p-8 rounded-lg text-xl">
                            <div className="w-full flex flex-col">
                                <div className="font-semibold">Thời gian: {duration} phút</div>
                                <div className="font-semibold mt-5">
                                    Thời gian còn lại: {(Math.floor(remainingTime/60)).toString().padStart(2, '0')}:{(remainingTime%60).toString().padStart(2, '0')}</div>
                                <div className="mt-5">
                                    {passages.map((passage, passageIndex) => {
                                        // get the total questions in the previous passages
                                        const passagesPrev = passages.slice(0, passageIndex);
                                        const countQuestionsEachPrevPassages = passagesPrev.map((passPrev) => {
                                            return passPrev.question_groups.reduce(
                                                (prevQuestions, group) => prevQuestions + group.questions.length, 0
                                            );
                                        });
                                        const totalQuestionsPrevPassages = countQuestionsEachPrevPassages.reduce(
                                            (total, number) => total + number, 0
                                        );
                                        // get the total questions of the current passage
                                        const countQuestionsCurrentPassage = passage.question_groups.reduce(
                                            (total, group) => total + group.questions.length, 0
                                        );
                                        return (
                                            <div key={passage.passage_number}>
                                                <span className="font-bold">Passage {passage.passage_number}</span>
                                                <div className="flex flex-wrap gap-4 my-5">
                                                    {Array.from({length: countQuestionsCurrentPassage}).map((_, index ) => {
                                                        return (
                                                            <div key={ totalQuestionsPrevPassages + index + 1 }>
                                                                <button 
                                                                onClick={() => {scrollToQuestion(totalQuestionsPrevPassages + index + 1)}}
                                                                className={`w-10 h-10 ${
                                                                    answered.has(totalQuestionsPrevPassages + index + 1) ? 'bg-green-500' : 'bg-gray-200'
                                                                } rounded-full grid place-items-center`}>{ totalQuestionsPrevPassages + index + 1 }</button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}