/**
 * Progress Steps Component
 * Shows current progress through multi-step process
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressSteps({ steps, currentStep, completedSteps }: ProgressStepsProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;

          return (
            <li key={step.id} className="flex-1 relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2",
                    isPast || isCompleted ? "bg-primary" : "bg-gray-200"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator */}
              <div className="relative flex flex-col items-center group">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all relative z-10",
                    isCompleted && "bg-primary text-white",
                    isCurrent && "bg-primary text-white ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-gray-200 text-gray-600"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary",
                      !isCurrent && "text-gray-600"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
