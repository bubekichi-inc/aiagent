import { NextRequest, NextResponse } from 'next/server'
import { mastra } from '@/mastra'

export async function POST(request: NextRequest) {
  try {
    ;(async () => {
      const { runId, start } = mastra.getWorkflow('weatherWorkflow').createRun()
      const runResult = await start({
        triggerData: { city: 'Shibuya' },
      })
      console.log('Final output:', runResult.results)
    })()

    // return stream.toDataStreamResponse()
  } catch (error) {
    return NextResponse.json(
      {
        message: 'エラーが発生しました',
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    )
  }
}
