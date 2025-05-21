'use client';
import useSWR from 'swr';
import Spinner from './Spinner';
import { Passage, Test } from '@/types/test';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import HandleScore from './HandleScore';

export default function HandleListeningTest({ test_slug }: { test_slug: string}) {
    const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
    const [answered, setAnswered] = useState<Set<number>>(new Set());
    const [studentAnswers, setStudentAnswers] = useState<Record<number, string[]>>({});
    const [testAnswers, setTestAnswers] = useState<Record<number, string[]>>({});
    const [remainingTime, setRemainingTime] = useState<number>(-1);
    const [countDown, setCountDown] = useState<boolean>(false);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [result, setResult] = useState<Record<number, boolean> | null>(null);
    const questionRef = useRef<(HTMLDivElement | null)[]>([]);
    const formRef = useRef<HTMLFormElement | null>(null);
    const [focusQuestion, setFocusQuestion] = useState<number | null>(null);
    const [countCorrectAnswer, setCountCorrectAnswer] = useState<number | null>(0);
    const [bandScore, setBandScore] = useState<number | null>(0);
    const [showScore, setShowScore] = useState<boolean>(false);
    const handleAnswer = (questionNumber: number, value: string, isCheckbox = false) => {
        setAnswered(prev => {
            const newSet = new Set(prev);
            if (value) {
                newSet.add(questionNumber);
            } else {
                newSet.delete(questionNumber);
            }
            return newSet;
        }); 
        setStudentAnswers(prevAnswer => {
            if (value && isCheckbox) {
               const checkboxes = document.querySelectorAll(`input[name="answer-${questionNumber}"]:checked`); // type nodelist
               const selectedCheckbox = Array.from(checkboxes).map(checkbox => (checkbox as HTMLInputElement ).value)
               return {
                ...prevAnswer,
                [questionNumber]: selectedCheckbox
               };
            } else {
                return {
                    ...prevAnswer,
                    [questionNumber]: value ? [value] : []
                };
            }
        });
    }

    const scrollToQuestion = (questionNumber: number, passageNumber: number) => {
        // Find passage that question belong to
        const targetPassage = passages.find(passage => passage.passage_number === passageNumber);
        // Set that passage is selected
        if (targetPassage && targetPassage.passage_number != selectedPassage?.passage_number) {
            setSelectedPassage(targetPassage);
        // Wait for rendering passage before scroll to
            setTimeout(() => {
                const targetQuestion = questionRef.current[questionNumber];
                    if (targetQuestion) {
                        targetQuestion.scrollIntoView({behavior: 'smooth', block: 'center'});
                        setFocusQuestion(questionNumber);
                    }
                }, 200); // wait 500ms for rendering passage before scroll to it
        } else {
            questionRef.current[questionNumber]?.scrollIntoView({behavior: 'smooth', block: 'center'});
            setFocusQuestion(questionNumber);

        }
    }
    const fetcher = (url: string) => fetch(url, {
        credentials: 'include'
    }).then(res => res.json());
    const { data, error, isLoading } = useSWR<Test>(
        `${process.env.NEXT_PUBLIC_TEST_API_URL}/by-slug/${test_slug}`,
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
            setSelectedPassage(data.passages[0]);
            const tempAnswers: Record<number, string[]> = {};
            data.passages.map(passage => {
                passage.question_groups.map(group => {
                    group.questions.map(question => {
                        tempAnswers[question.question_number] = question.answer;
                    })
                })
            })
            setTestAnswers(tempAnswers);
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
    }, [countDown, remainingTime]);

    useEffect(() => {
        if (remainingTime === 0) {
            if (formRef.current) {
                formRef.current.requestSubmit();
            }
        }
    }, [remainingTime, formRef]);
        
    if (isLoading) return <Spinner />
    if (error) return <div>Error: {error.message}</div>
    if (!data) return <div>No data found for the test slug: {test_slug}</div>
    const { title, passages, duration, level, type } = data;

    const checkAnswers = () => {
        const answerRecord: Record<number, boolean> = {};
        Object.keys(testAnswers).forEach(questionNumber => {
            const questionNum = Number(questionNumber);
            const answersTest = testAnswers[questionNum]; // lấy tất cả câu trả lời của bài test
            const answersStudent = studentAnswers[questionNum] || []; // lấy tất cả câu trả lời của học sinh nếu để trống thì là rỗng
            if (answersStudent.length === 0) {
                answerRecord[questionNum] = false;
            } else {
                // Kiểm tra độ dài các câu trả lời của học sinh so với bài test nếu khác thì là sai không cần kiểm tra gì thêm
                const isSameLength = answersTest.length === answersStudent.length;
                // Chuyển các câu trả lời của test và student về lower case và xoá các khoảng trắng trước và sau của từ trước khi kiểm tra đúng sai
                const answersStudentToLowerCase = answersStudent.map(a => a.trim().toLowerCase());
                const answersTestToLowerCase = answersTest.map(a => a.trim().toLowerCase());
                // Kiểm tra đúng hay sai
                const isCorrect = isSameLength && answersTestToLowerCase.every(item => answersStudentToLowerCase.includes(item));
                answerRecord[questionNum] = isCorrect;
            }
        })
        return answerRecord;
    }

    const checkBandScore = (numberCorrectAnswers: number) => {
        if (numberCorrectAnswers === 3 || numberCorrectAnswers === 4) return 2.5; 
        if (numberCorrectAnswers === 5 || numberCorrectAnswers === 6) return 3.0; 
        if (numberCorrectAnswers >= 7 && numberCorrectAnswers <= 9) return 3.5; 
        if (numberCorrectAnswers >= 10 && numberCorrectAnswers <= 12) return 4.0; 
        if (numberCorrectAnswers >= 13 && numberCorrectAnswers <= 15) return 4.5; 
        if (numberCorrectAnswers >= 16 && numberCorrectAnswers <= 19) return 5.0; 
        if (numberCorrectAnswers >= 20 && numberCorrectAnswers <= 22) return 5.5; 
        if (numberCorrectAnswers >= 23 && numberCorrectAnswers <= 26) return 6.0; 
        if (numberCorrectAnswers >= 27 && numberCorrectAnswers <= 29) return 6.5; 
        if (numberCorrectAnswers >= 30 && numberCorrectAnswers <= 32) return 7.0; 
        if (numberCorrectAnswers === 33 || numberCorrectAnswers === 34) return 7.5; 
        if (numberCorrectAnswers === 35 || numberCorrectAnswers === 36) return 8.0; 
        if (numberCorrectAnswers === 37 || numberCorrectAnswers === 38) return 8.5; 
        if (numberCorrectAnswers === 40 || numberCorrectAnswers === 40) return 9.0; 
        return 0;
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (Object.keys(studentAnswers).length < 40 && remainingTime > 0) {
            toast.warning('Bạn cần điền đủ các câu trả lời trước khi bấm nút nộp bài ~!!😭😭!!~~');
        } else if (Object.keys(studentAnswers).length < 40 && remainingTime === 0) {
            toast.warning('Thời gian làm bài đã hết. Bài làm sẽ được nộp tự động!~😎~😎~!');
            const result = checkAnswers();
            setResult(result);
            setIsSubmitted(true);
            const countAnswers = Object.values(result).filter(value => value === true).length;
            setCountCorrectAnswer(countAnswers);
            setBandScore(checkBandScore(countAnswers));
            // Send result to handle score component
            setShowScore(true);
        } else {
            toast.success("Nộp bài thành công!!~😍~😍~😍~!!");
            const result = checkAnswers();
            setResult(result);
            setIsSubmitted(true);
            // Đếm xem có bao nhiêu câu đúng
            const countAnswers = Object.values(result).filter(value => value === true).length;
            setCountCorrectAnswer(countAnswers);
            // Tính điểm band score
            setBandScore(checkBandScore(countAnswers));
            // Send result to handle score component
            setShowScore(true);
        }

    }
    return (
        <form className="w-full" onSubmit={handleSubmit} ref={formRef}>
            <h1 className='mt-8 text-2xl font-bold text-center'>{title} / <span className="text-md text-orange-500">{level}</span></h1>
            <div className={`${isSubmitted ? 'flex flex-col w-[400px] items-center gap-5 justify-center mt-10 bg-white mx-auto p-5 rounded-xl text-2xl' : 'hidden'}`}>
                <div className="flex items-center justify-center gap-5">
                    <div><span className="font-bold text-orange-500">{countCorrectAnswer}</span> <span className="font-bold">/ 40</span></div>
                    <span className="font-bold">Band: <span className="text-orange-500">{bandScore}</span></span>
                </div>
                {showScore && (
                    <HandleScore test_name={title} test_type={type} score={bandScore || 0} duration={ duration*60 - remainingTime }/>
                )}
            </div>
            <div className="w-full mt-4 pl-10 flex">
                {passages.map((passage) => (
                    <button
                    type='button'
                    key={passage.passage_number}
                    onClick={() => setSelectedPassage(passage)}
                    className={`bg-gray-400 text-black font-semibold p-4 mb-5 rounded-[50%] mx-5 hover:bg-orange-500 hover:cursor-pointer hover:scale-110 hover:text-white transition-all duration-300 ease-in-out ${selectedPassage?.passage_number===passage.passage_number ? 'bg-orange-500 text-white' : ''}`}>
                        Section {passage.passage_number}
                    </button>
                ))}
            </div>
            <div className="passage-container w-full h-[65vh] mb-10">
                {selectedPassage && ( // if there is a selected passage, then render the passage
                    <div className="w-[95vw] mx-auto bg-white flex h-full p-5 shadow-lg rounded-2xl overflow-auto">
                        <div className="flex w-10/12 rounded-lg">
                            <div className="w-[60%] px-4 overflow-y-auto">
                                <h2 className="font-bold text-2xl mt-4">{selectedPassage.title}</h2>
                                <div className="mt-2 text-justify leading-loose text-md lg:text-xl">
                                    {selectedPassage.audio_url && (
                                        <audio key={selectedPassage.passage_number} controls className="w-full mb-4">
                                            <source src={selectedPassage.audio_url} type="audio/mpeg" />
                                            Trình duyệt của bạn không hỗ trợ phát audio.
                                        </audio>
                                    )}
                                    {selectedPassage.content && selectedPassage.content.type === 'image' && selectedPassage.content.value ? (
                                        <Image 
                                            key={selectedPassage.passage_number}
                                            src={selectedPassage.content.value} 
                                            alt="Passage content" 
                                            width={500}
                                            height={500}
                                            className="max-w-full h-auto rounded-lg shadow-md"
                                        />
                                    ) : (
                                        selectedPassage.content?.value
                                    )}
                                </div>
                            </div>
                            <div className="w-[40%] mt-5 px-5 overflow-y-auto h-full">
                                <div>
                                    {selectedPassage.question_groups.map((group) => (
                                        <div key={group.group_title} className="leading-normal lg:leading-loose text-md lg:text-xl">
                                            <h3 className="font-bold text-left">{group.group_title}</h3>
                                            <p>{group.group_instruction}</p>
                                            {/* Thêm phần hiển thị content của group */}
                                            {group.content && (
                                                <div className="mt-4 mb-4">
                                                    {group.content.type === 'image' && group.content.value ? (
                                                        <Image 
                                                            src={group.content.value} 
                                                            alt="Group content" 
                                                            width={500}
                                                            height={300}
                                                            className="max-w-full h-auto rounded-lg shadow-md"
                                                        />
                                                    ) : group.content.type === 'text' && group.content.value ? (
                                                        <div className="text-justify">
                                                            {group.content.value}
                                                        </div>
                                                    ) : group.content.type === 'html' && group.content.value ? (
                                                        <div 
                                                            className="text-justify"
                                                            dangerouslySetInnerHTML={{ __html: group.content.value }}
                                                        />
                                                    ) : null}
                                                </div>
                                            )}
                                            {group.given_words && group.given_words.length > 0 && (
                                                <div className="border-1 rounded-lg p-2">
                                                    {group.given_words?.map((word) => (
                                                        <div key={word} className="border-1 rounded-lg p-2">
                                                            {word}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mb-5">
                                                {group.questions.map((question) => {
                                                    const isCorrect = result?.[question.question_number];
                                                    return (
                                                    <div key={question.question_number} 
                                                    className={`${focusQuestion === question.question_number ? 'border-2 border-orange-500 p-3 rounded-lg' : ''} ${isSubmitted ? (isCorrect ? 'bg-green-100' : 'bg-red-100') : ''}`}
                                                    ref={el => {questionRef.current[question.question_number] = el}}>
                                                        <div className="flex items-center gap-3">
                                                            {question.question_number}. {question.question_text}
                                                            {isSubmitted && (
                                                                <>
                                                                    <span className={`${isCorrect ? '' : 'text-red-500'}`}>{isCorrect ? '✅' : '✘'}</span>
                                                                    {!isCorrect && <span className="text-green-500 ml-1">{question.answer}</span>}
                                                                </>
                                                            )}
                                                        </div>
                                                        <span className="text-sm bg-yellow-200 text-justify">{isSubmitted ? `Explaination: ${question.explaination}` : ''}</span>
                                                        {/* Fill in blank */}
                                                        {question.question_type === 'fill-in-blank' && (
                                                            <div>
                                                                <div className="w-full">
                                                                    <input type="text" className="border-1 w-[90%] max-w-[400px] rounded-lg p-2" 
                                                                    name={`answer-${question.question_number}`}
                                                                    value={studentAnswers[question.question_number]?.[0] || ''}
                                                                    onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Fill in blank optional */}
                                                        {question.question_type === 'fill-in-blank-optional' && (
                                                            <div>
                                                                <div>
                                                                    <select className="bg-gray-200 p-2 rounded-lg w-[60%] max-w-[60%]" 
                                                                    name={`answer-${question.question_number}`}
                                                                    value={studentAnswers[question.question_number]?.[0] || ''}
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
                                                        {/* True false not given */}
                                                        {question.question_type === 'true-false-not-given' && (
                                                            <div>
                                                                <div>
                                                                    <select className="bg-gray-200 p-2 rounded-lg w-[60%] max-w-[60%]" 
                                                                    name={`answer-${question.question_number}`}
                                                                    value={studentAnswers[question.question_number]?.[0] || ''}
                                                                    onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                    >
                                                                        <option value="">Select an option</option>
                                                                        <option value="true">True</option>
                                                                        <option value="false">False</option>
                                                                        <option value="not given">Not Given</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Multiple choice */}
                                                        {question.question_type === 'multiple-choice' && (
                                                            <div>
                                                                <div>
                                                                    {question?.options?.map((option) => (
                                                                        <div className="flex items-center gap-2" key={option}>
                                                                            <input className="size-5" type="checkbox" key={option} 
                                                                            name={`answer-${question.question_number}`} 
                                                                            value={option}
                                                                            checked={studentAnswers[question.question_number]?.includes(option) || false}
                                                                            onChange={(event) => {
                                                                                const checkboxed = document.querySelectorAll(`input[name="answer-${question.question_number}"]:checked`);
                                                                                if (checkboxed.length === 0) {
                                                                                    handleAnswer(question.question_number, '', true);
                                                                                } else {
                                                                                    handleAnswer(question.question_number, event.target.value, true);
                                                                                }
                                                                            }}
                                                                            />
                                                                            <label>{option}</label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Matching or correct optional */}
                                                        {(question.question_type === 'matching' || question.question_type === 'correct-optional') && (
                                                            <div>
                                                                <div>
                                                                    {question.question_type === 'matching' ? (
                                                                        <div className="space-y-2">
                                                                            {question?.options?.map((option, index) => (
                                                                                <div key={index} className="flex items-center gap-2">
                                                                                    <span className="w-1/3">{option}</span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={studentAnswers[question.question_number]?.[index] || ''}
                                                                                        onChange={(e) => {
                                                                                            const newAnswers = [...(studentAnswers[question.question_number] || [])];
                                                                                            newAnswers[index] = e.target.value;
                                                                                            handleAnswer(question.question_number, e.target.value);
                                                                                        }}
                                                                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                                                        placeholder="Nhập đáp án tương ứng"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <select className="bg-gray-200 p-2 rounded-lg w-[60%] max-w-[60%]" 
                                                                        name={`answer-${question.question_number}`}
                                                                        value={studentAnswers[question.question_number]?.[0] || ''}
                                                                        onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                        >
                                                                            <option value="">Select an option</option>
                                                                            {question?.options?.map((option) => (
                                                                                <option key={option} value={option}>{option}</option>
                                                                            ))}
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Map question type */}
                                                        {question.question_type === 'map' && (
                                                            <div>
                                                                <select 
                                                                name={`answer-${question.question_number}`}
                                                                value={studentAnswers[question.question_number]?.[0] || ''}
                                                                onChange={(event) => {handleAnswer(question.question_number, event.target.value)}}
                                                                className="bg-gray-200 p-2 rounded-lg w-[60%] max-w-[60%]"
                                                                >
                                                                    <option value="">Select an option</option>
                                                                    {group?.given_words?.map((word) => (
                                                                        <option key={word} value={word}>{word}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                );})}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="w-2/12 pl-2 lg:pl-6 rounded-lg text-md lg:text-xl overflow-y-auto">
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
                                                <span className="font-bold">Section {passage.passage_number}</span>
                                                <div className="flex flex-wrap gap-2 lg:gap-4 my-5">
                                                    {Array.from({length: countQuestionsCurrentPassage}).map((_, index ) => {
                                                        return (
                                                            <div key={ totalQuestionsPrevPassages + index + 1 }>
                                                                <button 
                                                                type='button'
                                                                onClick={() => {scrollToQuestion(totalQuestionsPrevPassages + index + 1, passage.passage_number)}}
                                                                className={`w-10 h-10 hover:cursor-pointer hover:scale-110 hover:bg-orange-500 hover:text-white transition-all ease-in-out duration-300 ${
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
            <div className="w-full flex justify-center items-center mb-5"><button type="submit"
            className="bg-orange-500 font-bold text-white p-3 rounded-lg hover:cursor-pointer hover:scale-110 hover:text-black transition-all duration-300 ease-in-out">Nộp bài</button></div>
        </form>
    )
}