/**
 * 测评题展示组件
 * 显示 AssessmentDesignerAgent 生成的测评题
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Assessment } from '../../types/pbl'

interface AssessmentQuestionsProps {
  assessment: Assessment
  onSubmit: (answers: string[]) => void
  onCancel?: () => void
}

export function AssessmentQuestions({ assessment, onSubmit, onCancel }: AssessmentQuestionsProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    new Array(assessment.questions.length).fill('')
  )

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[questionIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[questionIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleSubmit = () => {
    // 检查是否所有题目都已回答
    if (selectedAnswers.some((answer) => !answer)) {
      alert('请回答所有题目')
      return
    }
    onSubmit(selectedAnswers)
  }

  const allAnswered = selectedAnswers.every((answer) => answer)

  return (
    <motion.div
      className="relative z-20 flex-1 flex flex-col px-16 py-12 overflow-y-auto no-scrollbar pointer-events-auto"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* 标题 */}
      <div className="mb-6 animate-fade-in">
        <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-sans font-medium uppercase tracking-wider">
          前置知识测评
        </span>
      </div>

      <h2 className="font-display text-[42px] text-primary leading-tight font-bold mb-8 animate-fade-in animate-delay-100">
        测一测你的掌握程度
      </h2>

      <p className="font-sans text-sm text-on-surface-variant mb-8 animate-fade-in animate-delay-200">
        请回答以下 {assessment.questions.length} 道题目，帮助我们了解你的知识水平
      </p>

      {/* 题目列表 */}
      <div className="space-y-8">
        {assessment.questions.map((question, qIndex) => (
          <div
            key={question.id ?? qIndex}
            className="relative z-10 p-6 rounded-lg bg-surface-container-low"
          >
            {/* 题目 */}
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-sans text-sm font-bold">
                {qIndex + 1}
              </span>
              <p className="font-serif text-base text-on-surface leading-relaxed flex-1">
                {question.question}
              </p>
            </div>

            {/* 选项 */}
            <div className="ml-11 space-y-2">
              {(question.type === 'short_answer' || question.options.length === 0) ? (
                <textarea
                  value={selectedAnswers[qIndex]}
                  onChange={(event) => handleAnswerChange(qIndex, event.target.value)}
                  placeholder="请输入你的答案..."
                  rows={5}
                  className="relative z-10 w-full rounded-[20px] bg-white px-5 py-4 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 shadow-sm outline-none transition-all border border-outline-variant/20 focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10 resize-y min-h-[140px] pointer-events-auto"
                />
              ) : (
                question.options.map((option, oIndex) => {
                  const optionLabel = String.fromCharCode(65 + oIndex) // A, B, C, D
                  const isSelected = selectedAnswers[qIndex] === option

                  return (
                    <button
                      type="button"
                      key={oIndex}
                      onClick={() => handleAnswerSelect(qIndex, option)}
                      className={`relative z-10 w-full text-left p-4 rounded-lg border transition-all pointer-events-auto ${
                        isSelected
                          ? 'border-secondary bg-secondary/5 shadow-sm'
                          : 'border-outline-variant/20 bg-white hover:border-secondary/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-sans text-xs font-bold transition-colors ${
                            isSelected
                              ? 'border-secondary bg-secondary text-white'
                              : 'border-outline-variant text-on-surface-variant'
                          }`}
                        >
                          {optionLabel}
                        </span>
                        <span className="font-sans text-sm text-on-surface">{option}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 mt-8 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-full font-sans text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`px-8 py-3 rounded-full font-sans text-sm font-bold transition-all ${
            allAnswered
              ? 'bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg hover:scale-105'
              : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
          }`}
        >
          提交答案
        </button>
      </div>
    </motion.div>
  )
}
