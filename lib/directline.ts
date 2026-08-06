export interface DirectLineResponse {
  conversationId: string;
  token: string;
  expires_in: number;
}

export interface ActivityResponse {
  id?: string;
  type: string;
  from: {
    id: string;
    name?: string;
  };
  text?: string;
  timestamp?: string;
}

export class DirectLineClient {
  private secret: string;
  private conversationId: string | null = null;
  private token: string | null = null;

  constructor(secret?: string) {
    this.secret = secret || process.env.DIRECT_LINE_SECRET || process.env.NEXT_PUBLIC_DIRECT_LINE_SECRET || '';
    if (!this.secret) {
      throw new Error('DIRECT_LINE_SECRET 또는 NEXT_PUBLIC_DIRECT_LINE_SECRET 값이 필요합니다.');
    }
  }

  async startConversation() {
    const response = await fetch('https://directline.botframework.com/v3/directline/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Conversation start failed: ${response.statusText}`);
    }

    const data = (await response.json()) as DirectLineResponse;
    this.conversationId = data.conversationId;
    this.token = data.token;

    return data;
  }

  async sendMessage(text: string) {
    if (!this.conversationId || !this.token) {
      await this.startConversation();
    }

    const activity = {
      type: 'message',
      from: { id: 'user', name: 'User' },
      text,
    };

    const postResponse = await fetch(`https://directline.botframework.com/v3/directline/conversations/${this.conversationId}/activities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!postResponse.ok) {
      throw new Error(`Send failed: ${postResponse.statusText}`);
    }

    return this.pollForBotResponse();
  }

  private async pollForBotResponse() {
    const start = Date.now();
    const timeout = 60000;
    const interval = 800;
    let watermark = '';

    while (Date.now() - start < timeout) {
      const url = watermark
        ? `https://directline.botframework.com/v3/directline/conversations/${this.conversationId}/activities?watermark=${watermark}`
        : `https://directline.botframework.com/v3/directline/conversations/${this.conversationId}/activities`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.statusText}`);
      }

      const data = await response.json();
      watermark = data.watermark ?? watermark;
      const activities = Array.isArray(data.activities) ? (data.activities as ActivityResponse[]) : [];
      const botActivities = activities.filter(
        (item) => item.type === 'message' && item.from.id !== 'user'
      );

      if (botActivities.length > 0) {
        return botActivities[botActivities.length - 1].text || '답변을 확인할 수 없습니다.';
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return '답변을 받는 데 시간이 조금 걸리고 있습니다. 잠시 후 다시 시도해 주세요.';
  }
}

let sharedClient: DirectLineClient | null = null;

export async function getDirectLineClient() {
  if (!sharedClient) {
    sharedClient = new DirectLineClient();
    await sharedClient.startConversation();
  }
  return sharedClient;
}

export function resetDirectLineClient() {
  sharedClient = null;
}
