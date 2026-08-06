import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: '질문을 입력해 주세요.' }, { status: 400 });
    }

    const secret = process.env.DIRECT_LINE_SECRET ?? process.env.NEXT_PUBLIC_DIRECT_LINE_SECRET;
    if (!secret) {
      return NextResponse.json({ error: '서버 설정이 올바르지 않습니다. 환경 변수를 확인해 주세요.' }, { status: 500 });
    }

    const conversationResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!conversationResponse.ok) {
      throw new Error('Conversation start failed');
    }

    const conversationData = await conversationResponse.json();
    const conversationId = conversationData.conversationId;
    const token = conversationData.token;

    const activityResponse = await fetch(
      `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'message',
          from: { id: 'user', name: 'User' },
          text,
        }),
      }
    );

    if (!activityResponse.ok) {
      throw new Error('Send failed');
    }

    const start = Date.now();
    const timeout = 60000;
    const interval = 800;
    let watermark = '';

    while (Date.now() - start < timeout) {
      const url = watermark
        ? `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities?watermark=${watermark}`
        : `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`;

      const pollResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!pollResponse.ok) {
        throw new Error('Polling failed');
      }

      const data = await pollResponse.json();
      watermark = data.watermark ?? watermark;
      const activities = Array.isArray(data.activities) ? data.activities : [];
      const botActivities = activities.filter(
        (item: any) => item.type === 'message' && item.from?.id !== 'user'
      );

      if (botActivities.length > 0) {
        return NextResponse.json({ reply: botActivities[botActivities.length - 1].text || '답변을 확인할 수 없습니다.' });
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return NextResponse.json({ reply: '죄송합니다. 잠시 후 다시 시도해 주세요.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: '죄송합니다. 서버와의 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
