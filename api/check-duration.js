const callStartTimes = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, call } = req.body;
    const MAX_DURATION_SECONDS = 15;
    
    let startTime;
    
    if (call.startedAt || call.createdAt) {
      startTime = new Date(call.startedAt || call.createdAt).getTime();
    } else {
      const callId = call.id;
      if (!callStartTimes.has(callId)) {
        callStartTimes.set(callId, Date.now());
      }
      startTime = callStartTimes.get(callId);
    }
    
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    
    if (elapsedSeconds >= MAX_DURATION_SECONDS) {
      callStartTimes.delete(call.id);
      return res.json({
        results: [{
          toolCallId: message.toolCallId,
          result: JSON.stringify({
            shouldEndCall: true,
            elapsed: Math.round(elapsedSeconds * 100) / 100
          })
        }]
      });
    } else {
      return res.json({
        results: [{
          toolCallId: message.toolCallId,
          result: JSON.stringify({
            shouldEndCall: false,
            remaining: Math.round((MAX_DURATION_SECONDS - elapsedSeconds) * 100) / 100
          })
        }]
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}