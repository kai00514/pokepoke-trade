import Image from "next/image"
import type { HowToPlayStep } from "../types/deck"

interface HowToPlayProps {
  howToPlayList: string[]
  howToPlaySteps: HowToPlayStep[]
}

export function HowToPlay({ howToPlayList, howToPlaySteps }: HowToPlayProps) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          {howToPlayList.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                {index + 1}
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {howToPlaySteps.map((step, index) => (
        <div key={index} className={index < howToPlaySteps.length - 1 ? "mb-8" : ""}>
          <div className="bg-blue-500 text-white px-4 py-2 rounded-t-lg">
            <div className="flex items-center">
              <div className="bg-white text-blue-500 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                {index + 1}
              </div>
              {step.title}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-b-lg">
            {step.image_urls &&
              step.image_urls.length > 0 && ( // ここを修正
                <div className="flex gap-4 mb-4">
                  {step.image_urls.map(
                    (
                      imageUrl,
                      imgIndex, // ここを修正
                    ) => (
                      <div key={imgIndex} className="w-32 h-44">
                        {imageUrl ? (
                          <Image
                            src={imageUrl || "/placeholder.svg"} // ここを修正
                            alt={`${step.title} 画像 ${imgIndex + 1}`}
                            width={128}
                            height={176}
                            className="w-full h-full object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded border"></div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: step.description }} />
          </div>
        </div>
      ))}
    </div>
  )
}
