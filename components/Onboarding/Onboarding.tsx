import { motion, AnimatePresence } from 'framer-motion'
import { useTour, TourStep } from '@/hooks/useTour'

const steps: TourStep[] = [
  { targetId: 'header', content: 'This is the header of our application.' },
  { targetId: 'sidebar', content: 'Here you can find navigation links.' },
  { targetId: 'main-content', content: 'This is where the main content is displayed.' },
  { targetId: 'footer', content: 'And finally, this is the footer.' },
]

export function Onboarding() {
  const { currentStep, isActive, start, stop, nextStep, totalSteps } = useTour(steps)

  return (
    <>
      {/* <ProgressBar currentStep={currentStep} totalSteps={totalSteps} /> */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-50"
          >
            <p className="text-lg font-semibold mb-2">{steps[currentStep].content}</p>
            <div className="flex justify-between">
              <button
                onClick={stop}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={start}
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors z-40"
      >
        Start Tour
      </button>
    </>
  )
}

