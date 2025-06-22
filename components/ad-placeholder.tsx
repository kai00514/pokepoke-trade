import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdPlaceholderProps {
  title: string
  className?: string
}

export default function AdPlaceholder({ title, className }: AdPlaceholderProps) {
  return (
    <Card className={cn("bg-purple-50 border-purple-200", className)}>
      <CardHeader>
        <CardTitle className="text-sm text-center font-normal text-purple-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-full">
        {/* 広告内容のプレースホルダーテキストは���除または調整 */}
      </CardContent>
    </Card>
  )
}
