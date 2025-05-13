import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // クエリパラメータを取得
    const body = await request.json();
    const { messages } = body;

    const agent = mastra.getAgent("weatherAgent");

    const stream = await agent.stream(messages[messages.length - 1].content);

    // toDataStreamResponseメソッドを使ってストリーミングレスポンスを返す
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("ベクトル検索エラー:", error);
    return NextResponse.json(
      {
        message: "検索処理中にエラーが発生しました",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
